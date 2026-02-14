import path from "path";
import fs from "fs";
import lockfile from "proper-lockfile";

// Import all data sources
import employeeTimesheetData from "../data/employee/timesheet.js";
import managerTeamData from "../data/manager/team.js";
import managerTaskData from "../data/manager/task.js";
import managerProjectData from "../data/manager/project.js";

/**
 * Creates a JSON file with initial data
 * @param {string} filePath - The file path where the JSON file will be created
 * @param {object} initialData - Initial data to write (optional)
 */
export const createJSONFile = async (filePath, initialData = {}) => {
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.promises.mkdir(dir, { recursive: true });

    // Write initial data
    await fs.promises.writeFile(
      filePath,
      JSON.stringify(initialData, null, 2),
      "utf-8",
    );
    console.log(`✅ Created JSON file: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error creating JSON file ${filePath}:`, error.message);
    throw error;
  }
};

/**
 * Reads a JSON file with retry mechanism and file locking for thread safety
 * @param {string} filePath - The file path to read
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<object>} The parsed JSON data
 */
export const readJSONFile = async (filePath, maxRetries = 5) => {
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(__dirname, filePath);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let release = null;

    try {
      // Wait a bit if this is a retry
      if (attempt > 1) {
        await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
      }

      // Check if file exists
      await fs.promises.access(
        absolutePath,
        fs.constants.F_OK | fs.constants.R_OK,
      );

      // Try to acquire a lock with retries
      try {
        release = await lockfile.lock(absolutePath, {
          retries: {
            retries: 5,
            minTimeout: 50,
            maxTimeout: 200,
          },
          stale: 5000, // Consider lock stale after 5 seconds
        });
      } catch {
        console.warn(
          `⚠️ Could not acquire lock for reading (attempt ${attempt}/${maxRetries}): ${absolutePath}`,
        );
        // Continue without lock if we can't acquire it
      }

      // Read the file
      const fileContent = await fs.promises.readFile(absolutePath, "utf-8");
      const data = JSON.parse(fileContent);

      // Release lock if we have one
      if (release) {
        await release();
      }

      return data;
    } catch (error) {
      // Always try to release lock on error
      if (release) {
        try {
          await release();
        } catch (releaseErr) {
          console.warn("⚠️ Error releasing lock:", releaseErr.message);
        }
      }

      console.warn(
        `⚠️ Attempt ${attempt}/${maxRetries} failed to read ${absolutePath}: ${error.message}`,
      );

      if (attempt === maxRetries) {
        console.error(
          `❌ Failed to read JSON file after ${maxRetries} attempts: ${absolutePath}`,
        );
        throw new Error(
          `Cannot read JSON file ${absolutePath} after ${maxRetries} attempts: ${error.message}`,
        );
      }
    }
  }
};

/**
 * Writes data to a JSON file with file locking for thread safety
 * @param {string} filePath - The file path where data will be written
 * @param {object} data - The data to write
 * @param {number} maxRetries - Maximum number of retry attempts
 */
export const writeDataToFile = async (filePath, data, maxRetries = 5) => {
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(__dirname, filePath);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let release = null;

    try {
      // Wait a bit if this is a retry
      if (attempt > 1) {
        await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
      }

      // Ensure directory exists
      const dir = path.dirname(absolutePath);
      await fs.promises.mkdir(dir, { recursive: true });

      // Try to acquire an exclusive lock
      try {
        release = await lockfile.lock(absolutePath, {
          retries: {
            retries: 10,
            minTimeout: 100,
            maxTimeout: 500,
          },
          stale: 5000, // Consider lock stale after 5 seconds
        });
      } catch (lockErr) {
        console.warn(
          `⚠️ Could not acquire lock for writing (attempt ${attempt}/${maxRetries}): ${absolutePath}`,
        );

        // If file doesn't exist yet, create it without lock
        if (lockErr.code === "ENOENT") {
          await fs.promises.writeFile(
            absolutePath,
            JSON.stringify(data, null, 2),
            "utf-8",
          );
          console.log(`✅ Created new file: ${absolutePath}`);
          return;
        }

        // For other lock errors, retry
        if (attempt === maxRetries) {
          throw new Error(
            `Failed to acquire write lock after ${maxRetries} attempts: ${lockErr.message}`,
          );
        }
        continue;
      }

      // Read existing data (if file exists) to merge
      let existingData = {};
      try {
        const content = await fs.promises.readFile(absolutePath, "utf-8");
        existingData = JSON.parse(content);
      } catch {
        // File doesn't exist or is empty, that's okay
      }

      // Merge data (deep merge for nested objects)
      const mergedData = deepMerge(existingData, data);

      // Write the merged data
      await fs.promises.writeFile(
        absolutePath,
        JSON.stringify(mergedData, null, 2),
        "utf-8",
      );

      // Release lock
      if (release) {
        await release();
      }

      //console.log(`✅ Successfully wrote to ${absolutePath} (attempt ${attempt})`);
      return;
    } catch (error) {
      // Always try to release lock on error
      if (release) {
        try {
          await release();
        } catch (releaseErr) {
          console.warn("⚠️ Error releasing lock:", releaseErr.message);
        }
      }

      console.warn(
        `⚠️ Attempt ${attempt}/${maxRetries} failed to write ${absolutePath}: ${error.message}`,
      );

      if (attempt === maxRetries) {
        console.error(
          `❌ Failed to write JSON file after ${maxRetries} attempts: ${absolutePath}`,
        );
        throw new Error(
          `Cannot write JSON file ${absolutePath} after ${maxRetries} attempts: ${error.message}`,
        );
      }
    }
  }
};

/**
 * Deep merge helper function
 */
function deepMerge(target, source) {
  const output = { ...target };

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (isObject(source[key]) && isObject(target[key])) {
        output[key] = deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    }
  }

  return output;
}

function isObject(item) {
  return item && typeof item === "object" && !Array.isArray(item);
}

/**
 * Creates an empty JSON file for a test case
 * @param {string} tcJsonPath - Path to the test case JSON file
 */
export const createJSONFilePerTC = async (tcJsonPath) => {
  const tcId = path.basename(tcJsonPath, ".json");
  await createJSONFile(tcJsonPath, { [tcId]: {} });
};

/**
 * Populates JSON stubs with data from the source modules
 * @param {string} jsonDir - Directory containing JSON files
 * @param {string[]} testCaseIDs - Array of test case IDs to populate
 */
export const populateJsonStubs = async (jsonDir, testCaseIDs) => {
  const dataSources = {
    employee: employeeTimesheetData,
    manager_team: managerTeamData,
    manager_task: managerTaskData,
    manager_project: managerProjectData,
  };

  for (const tcId of testCaseIDs) {
    const filePath = path.join(jsonDir, `${tcId}.json`);
    let dataToWrite = {};

    // Collect data from all sources
    for (const sourceData of Object.values(dataSources)) {
      if (sourceData[tcId]) {
        // If data exists in this source, add it
        dataToWrite = deepMerge(dataToWrite, { [tcId]: sourceData[tcId] });
      }
    }

    // Write data if we found any
    if (Object.keys(dataToWrite).length > 0) {
      try {
        await writeDataToFile(filePath, dataToWrite);
        //console.log(`✅ Populated ${tcId}.json with data from source modules`);
      } catch (err) {
        console.error(`❌ Failed to populate ${tcId}.json:`, err.message);
        throw err;
      }
    } else {
      console.warn(`⚠️ No data found for ${tcId} in any source module`);
    }
  }
};

export default {
  createJSONFile,
  readJSONFile,
  writeDataToFile,
  createJSONFilePerTC,
  populateJsonStubs,
};
