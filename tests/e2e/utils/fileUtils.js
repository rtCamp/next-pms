const fs = require("fs").promises;
const path = require("path");

const timesheetPayloads = require("../data/employee/timesheet");
const teamPayloads = require("../data/manager/team");
const taskPayloads = require("../data/manager/task");

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

/**
 * Writes data into the specified file asynchronously.
 */
export const writeDataToFile = async (filePath, data) => {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error(`Failed to write data to file ${filePath}: ${error.message}`);
  }
};
/**
 * Ensures a JSON file exists (you already have createJSONFile for this)
 * and then populates it with the merged payload object.
 *
 * @param {string} jsonDir        Absolute path to your json-files directory
 * @param {string[]} testCaseIDs  Array of TC IDs (e.g. ["TC2"])
 */
export const populateJsonStubs = async (jsonDir, testCaseIDs) => {
  for (const tc of testCaseIDs) {
    const filePath = path.join(jsonDir, `${tc}.json`);

    // 1) ensure file exists
    await createJSONFile(filePath);

    // 2) build the merged payload
    const payloadObj = {
      ...(timesheetPayloads[tc] || {}),
      ...(teamPayloads[tc]      || {}),
      ...(taskPayloads[tc]      || {}),
    };

    // 3) wrap it under the test‑case key
    const wrapped = { [tc]: payloadObj };

    // 4) overwrite the file with *only* that wrapped object
    await fs.writeFile(filePath, JSON.stringify(wrapped, null, 2), "utf-8");
    console.log(`• Wrote ${filePath} with root key "${tc}"`);
  }
};

export const createJSONFilePerTC = async (filePath) => {
  try {
    // Check if file exists
    await fs.access(filePath);
  } catch {
    // If file does not exist, create directory and file
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify({}, null, 2), "utf-8");
    console.log(`✅ Created JSON file: ${filePath}`);
  }
};