const FILE_EXTENSION_REGEX = /\.([0-9a-z]+)(?:[\?#]|$)/i;

export function escapeHtml(unsafe: string) {
  return unsafe
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function getFileExtension(filename: string) {
  if (!filename || filename.endsWith("/") || filename.startsWith(".")) {
    return "";
  }

  const match = filename.match(FILE_EXTENSION_REGEX);
  return match ? match[1].toLowerCase() : "";
}
