const fs = require("fs").promises;
const path = require("path");

// ------------------------------------------------------------------------------------------

/**
 * Creates a JSON file in the specified relative path if it doesn't exist
 */
export const createJSONFile = async (relativePath) => {
  // Resolve absolute path
  const absolutePath = path.resolve(__dirname, relativePath);

  try {
    // Check if file exists
    await fs.access(absolutePath);
  } catch {
    // If file does not exist, create it
    await fs.writeFile(absolutePath, JSON.stringify({}, null, 2), "utf-8");
  }
};

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
