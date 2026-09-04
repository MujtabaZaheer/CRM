/**
 * EduCRM Document Storage — Firebase Storage
 * Sensitive documents are stored beneath the authenticated student's private path.
 */

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../firebase/config";

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

export const uploadStudentDocument = async (studentId: string, file: File) => {
  const validationError = validateDocumentFile(file);
  if (validationError) throw new Error(validationError);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `student_documents/${studentId}/${crypto.randomUUID()}-${safeName}`;
  const storageRef = ref(storage, storagePath);
  const snapshot = await uploadBytes(storageRef, file, { contentType: file.type });
  const fileUrl = await getDownloadURL(snapshot.ref);
  return {
    fileName: file.name,
    filePath: storagePath,
    fileSize: file.size,
    fileType: file.type,
    fileUrl,
  };
};
