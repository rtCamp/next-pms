/** A file name's extension in capitals, e.g. `"PDF"`, or `"FILE"` when it has none. */
export function fileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  if (dot === -1 || dot === fileName.length - 1) return "FILE";
  return fileName.slice(dot + 1).toUpperCase();
}

/** A file name without its extension. */
export function fileBaseName(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, "");
}
