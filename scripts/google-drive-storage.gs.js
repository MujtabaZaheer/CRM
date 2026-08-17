/**
 * EduCRM Google Drive Storage Backend
 * Deploy this as a Google Apps Script Web App.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://script.google.com
 * 2. Click "New Project"
 * 3. Delete the default code and paste this entire file
 * 4. Click "Deploy" → "New deployment"
 * 5. Type: "Web app"
 * 6. Execute as: "Me"
 * 7. Who has access: "Anyone"
 * 8. Click "Deploy" and authorize
 * 9. Copy the Web App URL and add it to your .env as VITE_STORAGE_SCRIPT_URL
 */

// Root folder name in your Google Drive
const ROOT_FOLDER_NAME = "EduCRM Documents";

function getOrCreateFolder(parent, name) {
  const folders = parent.getFoldersByName(name);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parent.createFolder(name);
}

function getRootFolder() {
  return getOrCreateFolder(DriveApp.getRootFolder(), ROOT_FOLDER_NAME);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const { fileName, fileBase64, mimeType, studentId } = data;

    if (!fileName || !fileBase64 || !mimeType || !studentId) {
      return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: "Missing required fields: fileName, fileBase64, mimeType, studentId" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    // Decode base64 to blob
    const blob = Utilities.newBlob(Utilities.base64Decode(fileBase64), mimeType, fileName);

    // Create folder structure: EduCRM Documents / {studentId}
    const root = getRootFolder();
    const studentFolder = getOrCreateFolder(root, studentId);

    // Save file with unique prefix to avoid collisions
    const uniquePrefix = Utilities.getUuid().substring(0, 8);
    const savedFile = studentFolder.createFile(blob).setName(uniquePrefix + "-" + fileName);

    // Make file viewable by anyone with the link
    savedFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileId = savedFile.getId();
    const fileUrl = "https://drive.google.com/uc?id=" + fileId + "&export=download";
    const viewUrl = "https://drive.google.com/file/d/" + fileId + "/view";

    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        fileId: fileId,
        fileUrl: fileUrl,
        viewUrl: viewUrl,
        fileName: savedFile.getName(),
        filePath: ROOT_FOLDER_NAME + "/" + studentId + "/" + savedFile.getName(),
      })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function — run this manually in the Apps Script editor to verify setup
function testSetup() {
  const root = getRootFolder();
  Logger.log("Root folder ready: " + root.getName() + " (ID: " + root.getId() + ")");
  Logger.log("Setup OK! You can now deploy as Web App.");
}
