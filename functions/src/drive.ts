import { HttpsError, onCall } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { google } from "googleapis";
import { Readable } from "stream";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const SERVICE_ACCOUNT_KEY = process.env.GOOGLE_DRIVE_CREDENTIALS;

// Helper to find or create a Google Drive Folder
async function getOrCreateFolder(drive: any, folderName: string, parentId?: string): Promise<string> {
  let query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  }
  
  const res = await drive.files.list({
    q: query,
    spaces: "drive",
    fields: "files(id, name)",
  });

  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id;
  }

  // Create it
  const fileMetadata: any = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
  };
  if (parentId) {
    fileMetadata.parents = [parentId];
  }

  const folder = await drive.files.create({
    requestBody: fileMetadata,
    fields: "id",
  });
  
  return folder.data.id;
}

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;

export const uploadToGoogleDrive = onCall({ enforceAppCheck: false, memory: "1GiB" }, async (request) => {
  // 1. Authenticate Request
  if (!request.auth) throw new HttpsError("unauthenticated", "Must be signed in.");
  const uid = request.auth.uid;

  // 2. Extract Data
  const { fileName, mimeType, base64Data, studentId, applicationId, documentType, existingDocumentId } = request.data;
  
  if (!fileName || !mimeType || !base64Data || !documentType) {
    throw new HttpsError("invalid-argument", "Missing file data or document type.");
  }
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new HttpsError("invalid-argument", "Unsupported file type.");
  }

  // Security: Check if user is staff OR the student themselves
  let isStaff = false;
  const db = getFirestore();
  const userSnap = await db.collection("users").doc(uid).get();
  if (userSnap.exists) {
    const role = userSnap.data()?.role;
    if (role === "admin" || role === "counsellor" || role === "platform_super_admin" || role === "org_admin") {
      isStaff = true;
    }
  }

  if (studentId !== uid && !isStaff) {
    throw new HttpsError("permission-denied", "You can only upload documents to your own profile.");
  }

  const buffer = Buffer.from(base64Data, "base64");
  if (buffer.length > MAX_DOCUMENT_BYTES) {
    throw new HttpsError("invalid-argument", "File size exceeds 15MB limit.");
  }

  // 3. Initialize Google Drive API
  if (!SERVICE_ACCOUNT_KEY) {
    logger.error("GOOGLE_DRIVE_CREDENTIALS missing.");
    throw new HttpsError("internal", "Google Drive API not configured on server.");
  }

  let credentials;
  try {
    credentials = JSON.parse(SERVICE_ACCOUNT_KEY);
  } catch (err) {
    throw new HttpsError("internal", "Invalid Google Drive credentials.");
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/drive"],
  });
  const drive = google.drive({ version: "v3", auth });

  try {
    // 4. Folder Hierarchy Engine
    const rootFolderId = await getOrCreateFolder(drive, "Education CRM");
    const studentsFolderId = await getOrCreateFolder(drive, "Students", rootFolderId);
    const studentFolderId = await getOrCreateFolder(drive, studentId, studentsFolderId);
    let targetFolderId = studentFolderId;
    
    if (applicationId) {
      const appsFolderId = await getOrCreateFolder(drive, "Applications", studentFolderId);
      const appFolderId = await getOrCreateFolder(drive, applicationId, appsFolderId);
      targetFolderId = await getOrCreateFolder(drive, "Documents", appFolderId);
    } else {
      targetFolderId = await getOrCreateFolder(drive, "General Documents", studentFolderId);
    }

    // 5. Delete previous file if replacing (Existing Document Logic)
    const db = getFirestore();
    let oldDriveFileId = null;
    
    if (existingDocumentId) {
      const oldDocRef = db.collection("student_documents").doc(existingDocumentId);
      const oldDocSnap = await oldDocRef.get();
      if (oldDocSnap.exists) {
        const oldData = oldDocSnap.data();
        if (oldData?.studentId === uid && oldData.driveFileId) {
          oldDriveFileId = oldData.driveFileId;
        }
      }
    }

    // 6. Upload new file to Drive
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    const driveResponse = await drive.files.create({
      requestBody: { name: safeName, parents: [targetFolderId] },
      media: { mimeType, body: stream },
      fields: "id, webViewLink",
    });

    const driveFileId = driveResponse.data.id;
    const driveUrl = driveResponse.data.webViewLink;
    if (!driveFileId || !driveUrl) throw new Error("Failed to get Drive ID.");

    // 7. Transactionally write to Firestore
    const documentRef = existingDocumentId ? db.collection("student_documents").doc(existingDocumentId) : db.collection("student_documents").doc();
    
    await db.runTransaction(async (transaction) => {
      // In a real scenario, we might read the application first to verify it exists and belongs to the student.
      const payload = {
        studentId,
        applicationId: applicationId || null,
        documentType,
        fileName: safeName,
        mimeType,
        size: buffer.length,
        driveFileId,
        driveFolderId: targetFolderId,
        driveUrl,
        status: "Pending", // Automatically reset to Pending if replaced
        updatedAt: Date.now(),
      };

      if (!existingDocumentId) {
        transaction.set(documentRef, { ...payload, createdAt: Date.now() });
      } else {
        transaction.update(documentRef, payload);
      }
    });

    // 8. Safely delete the old file from Google Drive AFTER Firestore transaction succeeds
    if (oldDriveFileId) {
      try {
        await drive.files.delete({ fileId: oldDriveFileId });
      } catch (delErr) {
        logger.error(`Failed to delete old drive file ${oldDriveFileId}`, delErr);
        // We don't fail the whole request just because cleanup failed.
      }
    }

    return {
      success: true,
      documentId: documentRef.id,
      driveFileId,
      driveUrl,
    };
  } catch (error: any) {
    logger.error("Upload Error:", error);
    throw new HttpsError("internal", error.message || "Failed to upload document.");
  }
});
