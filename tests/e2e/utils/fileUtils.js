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
    const dir = path.dirname(absolutePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(absolutePath, JSON.stringify({}, null, 2), "utf-8");
  }
};

/**
 * Reads a JSON file from a file path with retries and better error handling
 */
export const readJSONFile = async (filePath, maxRetries = 5) => {
  // Support both absolute paths and paths relative to this file
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(__dirname, filePath);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // First check if file exists and is readable
      await fs.access(absolutePath, fs.constants.F_OK | fs.constants.R_OK);
      
      // Read the file
      const data = await fs.readFile(absolutePath, "utf-8");
      
      // Verify it's valid JSON before returning
      const parsed = JSON.parse(data);
      
      console.log(`✅ Successfully read JSON file: ${absolutePath} (attempt ${attempt})`);
      return parsed;
    } catch (error) {
      console.warn(`⚠️ Attempt ${attempt}/${maxRetries} failed to read ${absolutePath}: ${error.message}`);
      
      if (attempt === maxRetries) {
        console.error(`❌ Failed to read JSON file after ${maxRetries} attempts: ${absolutePath}`);
        throw new Error(`Cannot read JSON file ${absolutePath} after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 100 * attempt));
    }
  }
};

/**
 * Writes data into the specified file asynchronously with retries
 */
export const writeDataToFile = async (filePath, data, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      
      // Write the file
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
      
      // Verify the file was written correctly
      await fs.access(filePath, fs.constants.F_OK | fs.constants.R_OK);
      
      console.log(`✅ Successfully wrote data to file: ${filePath} (attempt ${attempt})`);
      return;
    } catch (error) {
      console.warn(`⚠️ Attempt ${attempt}/${maxRetries} failed to write ${filePath}: ${error.message}`);
      
      if (attempt === maxRetries) {
        console.error(`❌ Failed to write data to file after ${maxRetries} attempts: ${filePath}`);
        throw new Error(`Cannot write to file ${filePath} after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 100 * attempt));
    }
  }
};

/**
 * Creates a JSON file at the specified absolute path if it doesn't exist
 * @param {string} filePath - Absolute path to the file
 */
export const createJSONFilePerTC = async (filePath) => {
  try {
    // Check if file exists
    await fs.access(filePath);
    console.log(`📄 File already exists: ${filePath}`);
  } catch {
    // If file does not exist, create directory and file
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify({}, null, 2), "utf-8");
    console.log(`✅ Created JSON file: ${filePath}`);
  }
};

/**
 * Ensures JSON files exist and populates them with merged payload data
 * @param {string} jsonDir - Absolute path to your json-files directory
 * @param {string[]} testCaseIDs - Array of TC IDs (e.g. ["TC2"])
 */
export const populateJsonStubs = async (jsonDir, testCaseIDs) => {
  console.log(`📁 Working with jsonDir: ${jsonDir}`);
  console.log(`📋 Processing testCaseIDs: ${JSON.stringify(testCaseIDs)}`);
  
  // Process files sequentially to avoid race conditions
  for (const tc of testCaseIDs) {
    const filePath = path.join(jsonDir, `${tc}.json`);
    console.log(`📄 Processing file: ${filePath}`);

    try {
      // 1) Ensure file exists
      await createJSONFilePerTC(filePath);

      // 2) Build the merged payload
      const payloadObj = {
        ...(timesheetPayloads[tc] || {}),
        ...(teamPayloads[tc] || {}),
        ...(taskPayloads[tc] || {}),
      };

      // 3) Wrap it under the test-case key
      const wrapped = { [tc]: payloadObj };

      // 4) Write the file with retries
      await writeDataToFile(filePath, wrapped);
      
      console.log(`✅ Successfully populated ${filePath} with root key "${tc}"`);
    } catch (error) {
      console.error(`❌ Failed to process ${filePath}:`, error.message);
      throw error;
    }
  }
};