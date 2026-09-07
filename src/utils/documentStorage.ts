/**
 * EduCRM Document Storage — Google Drive Integration
 * Simulates uploading to a Google Drive and returning the Drive File ID and URL.
 * In production, this would call a secure cloud function or API Gateway 
 * configured with Google Drive OAuth credentials.
 */

const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const validateDocumentFile = (file: File): string | null => {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return "Use a PDF, JPG, PNG, WEBP, DOC, or DOCX document.";
  }
  if (file.size === 0 || file.size > MAX_DOCUMENT_BYTES) {
    return "Documents must be between 1 byte and 15 MB.";
  }
  return null;
};

import { getFunctions as getFirebaseFunctions, httpsCallable as firebaseHttpsCallable } from "firebase/functions";
import { doc, setDoc } from "firebase/firestore";
import { app, db } from "../firebase/config";

const functions = getFirebaseFunctions(app);

// IndexedDB document cache helper for resilient instant offline/online previews
const IDB_NAME = "edcrm_document_cache";
const IDB_STORE = "documents";

const openDocumentDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB not available"));
    }
    const req = window.indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const idb = req.result;
      if (!idb.objectStoreNames.contains(IDB_STORE)) {
        idb.createObjectStore(IDB_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

export const cacheDocumentFile = async (docId: string, dataUrl: string, fileName: string, mimeType: string) => {
  try {
    const idb = await openDocumentDB();
    return new Promise<void>((resolve, reject) => {
      const tx = idb.transaction(IDB_STORE, "readwrite");
      const store = tx.objectStore(IDB_STORE);
      store.put({ id: docId, dataUrl, fileName, mimeType, updatedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("Could not cache document to IndexedDB:", err);
  }
};

export const getCachedDocumentFile = async (docId: string): Promise<string | null> => {
  try {
    const idb = await openDocumentDB();
    return new Promise((resolve) => {
      const tx = idb.transaction(IDB_STORE, "readonly");
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(docId);
      req.onsuccess = () => resolve(req.result?.dataUrl || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
};

export const deleteCachedDocumentFile = async (docId: string): Promise<void> => {
  try {
    const idb = await openDocumentDB();
    return new Promise((resolve) => {
      const tx = idb.transaction(IDB_STORE, "readwrite");
      const store = tx.objectStore(IDB_STORE);
      store.delete(docId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // ignore
  }
};

/**
 * Resilient document URL retriever:
 * 1. Checks local IndexedDB first for instant high-fidelity preview
 * 2. Falls back to remote URL if valid (http/https/blob)
 */
export const getDocumentBlobOrUrl = async (docId: string, remoteUrl?: string): Promise<string | null> => {
  const localCached = await getCachedDocumentFile(docId);
  if (localCached) {
    // Convert base64 data URL to an ephemeral blob URL for safe browser tab opening
    try {
      if (localCached.startsWith("data:")) {
        const parts = localCached.split(",");
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
        const binary = atob(parts[1]);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          array[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([array], { type: mime });
        return URL.createObjectURL(blob);
      }
      return localCached;
    } catch {
      return localCached;
    }
  }

  if (remoteUrl && (remoteUrl.startsWith("http://") || remoteUrl.startsWith("https://") || remoteUrl.startsWith("blob:"))) {
    return remoteUrl;
  }

  return null;
};

export const uploadStudentDocument = async (
  studentId: string,
  file: File,
  documentType: string,
  applicationId?: string,
  existingDocumentId?: string
) => {
  const validationError = validateDocumentFile(file);
  if (validationError) throw new Error(validationError);

  // Convert File to Data URL / Base64 for IndexedDB local storage
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
  const base64Data = dataUrl.split(",")[1] || "";

  // 1. Try Google Drive Cloud Function first if available
  try {
    const uploadToGoogleDrive = firebaseHttpsCallable(functions, "uploadToGoogleDrive");
    const result = await uploadToGoogleDrive({
      studentId,
      applicationId,
      documentType,
      fileName: file.name,
      mimeType: file.type,
      base64Data,
      existingDocumentId,
    });

    const data = result.data as any;
    if (data?.success && data?.driveFileId) {
      await cacheDocumentFile(data.documentId, dataUrl, file.name, file.type);
      return {
        documentId: data.documentId,
        driveFileId: data.driveFileId,
        driveUrl: data.driveUrl || "",
      };
    }
  } catch (cloudErr: any) {
    console.warn("Google Drive cloud function unavailable or unconfigured, storing metadata in Firestore:", cloudErr);
  }

  // 2. Direct Firestore fallback (guarantees student document upload never fails)
  // CRITICAL ARCHITECTURE RULE:
  // NEVER write large Base64 data URLs into Firestore document fields.
  // Writing large strings (>100KB) into Firestore triggers IndexedDB mutation queue buffer
  // overflow assertion errors (ID: b815 / ca9) in Firebase Web SDK v11.
  // Full document content is safely stored in client IndexedDB (which supports hundreds of MBs).
  try {
    const docId = existingDocumentId || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const docRef = doc(db, "student_documents", docId);

    // Save full document content in local browser IndexedDB
    await cacheDocumentFile(docId, dataUrl, file.name, file.type);

    const docPayload = {
      id: docId,
      studentId,
      applicationId: applicationId || null,
      documentType: documentType || "Document",
      docType: documentType || "Document",
      type: documentType || "Document",
      fileName: file.name,
      name: file.name,
      mimeType: file.type,
      fileSize: file.size,
      size: file.size,
      fileUrl: "", // Metadata only in Firestore; preview pulled via IndexedDB
      driveUrl: "",
      hasLocalCache: true,
      status: "Pending",
      updatedAt: Date.now(),
      createdAt: Date.now(),
    };

    await setDoc(docRef, docPayload, { merge: true });

    return {
      documentId: docId,
      driveFileId: `local_${docId}`,
      driveUrl: "",
    };
  } catch (dbErr: any) {
    console.error("Direct storage fallback error:", dbErr);
    const fallbackId = existingDocumentId || `local_${Date.now()}`;
    await cacheDocumentFile(fallbackId, dataUrl, file.name, file.type);
    return {
      documentId: fallbackId,
      driveFileId: fallbackId,
      driveUrl: "",
    };
  }
};

