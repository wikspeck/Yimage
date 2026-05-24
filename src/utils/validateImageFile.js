const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_EXTENSIONS = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "image/gif": ["gif"]
};
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function getFileExtension(filename) {
  const normalized = String(filename || "").trim().toLowerCase();
  const parts = normalized.split(".");
  return parts.length > 1 ? parts.pop() : "";
}

export function validateImageFile(file) {
  if (!file) {
    return {
      valid: false,
      message: "Choose an image to continue."
    };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      message: "Only JPG, PNG, WEBP, and GIF files are supported right now."
    };
  }

  const extension = getFileExtension(file.name);
  const allowedExtensions = ALLOWED_EXTENSIONS[file.type] || [];

  if (!extension || !allowedExtensions.includes(extension)) {
    return {
      valid: false,
      message: "The file extension does not match an allowed image type."
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      message: "This file is larger than the 10 MB limit."
    };
  }

  return {
    valid: true,
    message: ""
  };
}
