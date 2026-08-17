/**
 * EduCRM Document Storage — Google Drive Backend (via Google Apps Script)
 *
 * Uploads student documents to Google Drive through a deployed
 * Google Apps Script web app. Completely free — no Firebase Storage
 * or Blaze plan required.
 *
 * Set VITE_STORAGE_SCRIPT_URL in .env to your deployed Apps Script Web App URL.
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

function getScriptUrl(): string {
  const url = import.meta.env.VITE_STORAGE_SCRIPT_URL;
  if (!url || url.trim() === "") {
    throw new Error(
      "Google Drive storage not configured. Set VITE_STORAGE_SCRIPT_URL in .env to your deployed Apps Script Web App URL."
    );
  }
  return url.trim();
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Strip the "data:mime;base64," prefix
      const base64 = dataUrl.split(",")[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export const uploadStudentDocument = async (studentId: string, file: File) => {
  const validationError = validateDocumentFile(file);
  if (validationError) throw new Error(validationError);

  const scriptUrl = getScriptUrl();
  const fileBase64 = await fileToBase64(file);

  const response = await fetch(scriptUrl, {
    method: "POST",
    body: JSON.stringify({
      fileName: file.name,
      fileBase64,
      mimeType: file.type,
      studentId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Upload to Google Drive failed");
  }

  return {
    fileName: file.name,
    filePath: result.filePath,
    fileSize: file.size,
    fileType: file.type,
    fileUrl: result.viewUrl || result.fileUrl,
  };
};
