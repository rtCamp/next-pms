const fs = require("fs").promises;
const path = require("path");

/**
 * Reads a JSON file from a relative path and returns its parsed content.
 */
export const readJSONFile = async (relativePath) => {
  // Resolve absolute path
  const absolutePath = path.resolve(__dirname, relativePath);
  const data = await fs.readFile(absolutePath, "utf-8");

  // Parse JSON and return
  return JSON.parse(data);
};
