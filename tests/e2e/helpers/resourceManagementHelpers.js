import path from "path";
import { readJSONFile, writeDataToFile } from "../utils/fileUtils";
import { deleteAllocation } from "../utils/api/projectRequests";
import { createAllocation } from "../utils/api/resourceManagementRequests";

// ------------------------------------------------------------------------------------------

/**
 * Creates resource allocations for all testCaseIDs passed in.
 * Looks for payloadCreateAllocation, payloadCreateAllocation1, etc. in the stub.
 */
export const createAllocationsForTestCases = async (testCaseIDs, jsonDir) => {
  const ALLOCATION_KEY_REGEX = /^payloadCreateAllocation(\w*)$/;

  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) return;

  const [tcId] = testCaseIDs;
  const stubPath = path.join(jsonDir, `${tcId}.json`);

  const fullStub = await readJSONFile(stubPath);
  const entry = fullStub[tcId];
  if (!entry) {
    console.warn(
      `⚠️ No data of create allocation for test case ${tcId} in ${stubPath}`,
    );
    return;
  }

  // Find all allocation keys matching the pattern
  const allocationKeys = Object.keys(entry).filter((key) =>
    ALLOCATION_KEY_REGEX.test(key),
  );

  if (allocationKeys.length === 0) {
    console.warn(`⚠️ No payloadCreateAllocation key(s) for TC ${tcId}`);
    return;
  }

  for (const allocationKey of allocationKeys) {
    const allocPayload = entry[allocationKey];
    if (!allocPayload) {
      console.warn(`⚠️ ${allocationKey} is empty for ${tcId}`);
      continue;
    }

    // Abort rather than continue: a test whose allocation never got created
    // fails later on a selector or a count, which reads as a broken test rather
    // than missing fixture data - the phantom failure this suite is full of.
    const res = await createAllocation(allocPayload);

    //save the allocation ID back to the stub for teardown:
    if (res?.data?.name) {
      const deleteKey = allocationKey.replace(
        "payloadCreateAllocation",
        "payloadDeleteAllocation",
      );
      entry[deleteKey] = { allocationId: res.data.name };
      console.log(
        `✅ Allocation created for ${tcId} (${allocationKey}): ${res.data.name}`,
      );
    } else {
      console.error(
        `❌ Failed to create allocation for ${tcId} (${allocationKey})`,
      );
    }
  }

  // Persist changes back to the stub file if you added delete keys
  await writeDataToFile(stubPath, { [tcId]: entry });
};
/**
 * Deletes resource allocations for all testCaseIDs passed in.
 * Looks for payloadDeleteAllocation, payloadDeleteAllocation1, etc. in the stub.
 */
export const deleteAllocationsForTestCases = async (testCaseIDs, jsonDir) => {
  const DELETE_ALLOC_REGEX = /^payloadDeleteAllocation(\w*)$/;
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) return;

  const [tcId] = testCaseIDs;
  const stubPath = path.join(jsonDir, `${tcId}.json`);

  const fullStub = await readJSONFile(stubPath);
  const entry = fullStub[tcId];
  if (!entry) {
    console.warn(`⚠️ No data for test case ${tcId} in ${stubPath}`);
    return;
  }

  // Find all delete allocation keys like payloadDeleteAllocation, payloadDeleteAllocation1, etc.
  const deleteAllocKeys = Object.keys(entry).filter((key) =>
    DELETE_ALLOC_REGEX.test(key),
  );

  if (deleteAllocKeys.length === 0) {
    console.warn(`⚠️ No payloadDeleteAllocation key(s) for TC ${tcId}`);
    return;
  }

  for (const deleteKey of deleteAllocKeys) {
    const allocationId = entry[deleteKey]?.allocationId;
    if (!allocationId) {
      console.warn(`⚠️ No allocationId found in ${deleteKey} for ${tcId}`);
      continue;
    }

    try {
      const { deleted, reason } = await deleteAllocation(allocationId);
      if (deleted)
        console.log(
          `🗑️  Allocation deleted for ${tcId} (${deleteKey}): ${allocationId}`,
        );
      else
        console.warn(
          `⚠️ Allocation ${allocationId} for ${tcId} (${deleteKey}) survived: ${reason}`,
        );
    } catch (err) {
      console.error(
        `❌ Failed to delete allocation for ${tcId} (${deleteKey}): ${err.message}`,
      );
    }
  }
};
