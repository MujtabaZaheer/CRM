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

// Initialize functions (assuming firebase app is initialized in config)
import { app } from "../firebase/config";

const functions = getFirebaseFunctions(app);

export const uploadStudentDocument = async (studentId: string, file: File, documentType: string, applicationId?: string, existingDocumentId?: string) => {
  const validationError = validateDocumentFile(file);
  if (validationError) throw new Error(validationError);

  // Convert File to Base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });

  const uploadToGoogleDrive = firebaseHttpsCallable(functions, 'uploadToGoogleDrive');

  try {
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

    if (!data.success || !data.driveFileId) {
      throw new Error("Failed to upload to Google Drive");
    }

    return {
      documentId: data.documentId,
      driveFileId: data.driveFileId,
      driveUrl: data.driveUrl,
    };
  } catch (error: any) {
    console.error("Google Drive Upload Error:", error);
    throw new Error(error.message || "Failed to upload document to secure storage.");
  }
};
