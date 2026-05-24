const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

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
