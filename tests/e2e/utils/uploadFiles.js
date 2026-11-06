import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "../data/upload-files");

/**
 * The first file in data/upload-files/<kind>, or null when the folder is empty.
 * `kind` is "valid" or "disallowed".
 */
export const getUploadFile = (kind) => {
  const dir = path.join(ROOT, kind);
  if (!fs.existsSync(dir)) return null;

  const name = fs
    .readdirSync(dir)
    .find((f) => !f.startsWith(".") && f.toLowerCase() !== "readme.md");

  return name ? { path: path.join(dir, name), name } : null;
};
