import path from "path";
import { getFormattedDate, getDateForWeekday } from "../utils/dateUtils";
import managerTeamData from "../data/manager/team.json";
import { readJSONFile } from "../utils/fileUtils";
import { deleteEmployee } from "../utils/api/employeeRequests";
import { getRandomValue } from "../utils/stringUtils";
import { submitTimesheetForApproval } from "./timesheetHelper";
import { actOnTimesheet } from "../utils/api/timesheetRequests";
import { writeDataToFile } from "../utils/fileUtils";
import { getShortFormattedDate } from "../utils/dateUtils";
import { createUserGroup, deleteUserGroup } from "../utils/api/userGroupRequests";

// Define file paths for shared JSON data files
const managerTeamDataFilePath = path.resolve(__dirname, "../data/manager/shared-team.json"); // File path of the manager team data JSON file

// Global variables to store shared data and reused across functions
let sharedManagerTeamData;

// ------------------------------------------------------------------------------------------

/**
 * Create a random Approval Status timesheet
 */
export const randomApprovalStatus = async (
  data = managerTeamData,
  approvalStatus = ["Approval Pending", "Partially Rejected"],
  testCases = ["TC92"]
) => {
  //Get a random Approval Status
  const randomApprStatus = getRandomValue(approvalStatus);
  console.warn(`Selected RANDOM Approval Status: ${randomApprStatus}`);

  const processTestCasesForApprovalStatus = async (data, randomApprStatus, testCases) => {
    for (const testCaseID of testCases) {
      const testCase = data[testCaseID];
      if (!testCase || !testCase.payloadApprovalStatus) {
        console.warn(`Invalid or missing data for test case: ${testCaseID} in randomApprovalStatus function`);
        continue;
      }
      //Store the random approval status in the json file
      testCase.payloadApprovalStatus.approvalStatus = randomApprStatus;

      //Submit timesheet for Approval
      await submitTimesheetForApproval(
        testCase.payloadApprovalStatus.empId,
        testCase.payloadApprovalStatus.managerID,
        testCase.payloadApprovalStatus.employeeAPI
      );
      switch (randomApprStatus) {
        case "Approval Pending":
          console.warn("CASE: Approval Pending");
          break;

        case "Partially Rejected":
          console.warn("CASE: Partially Rejected");
          //Convert the timesheet entry day to a proper date
          const formattedDate = getFormattedDate(getDateForWeekday(testCase.cell.col));

          await actOnTimesheet({
            dates: [formattedDate], // or multiple dates if needed
            employee: testCase.payloadApprovalStatus.empId,
            note: "Partial rejecting timesheet via API",
            status: "Rejected",
          });
          break;

        default:
          console.warn(`Unhandled approval status: ${randomApprStatus}`);
      }
    }
  };
  await processTestCasesForApprovalStatus(data, randomApprStatus, testCases);
  await writeDataToFile(managerTeamDataFilePath, managerTeamData);
};
// ------------------------------------------------------------------------------------------

/**
 * Delete the employee created in global setup
 */
export const deleteEmployees = async () => {
  sharedManagerTeamData = await readJSONFile("../data/manager/shared-team.json");
  const managerTeamIDs = ["TC91"];

  for (const teamID of managerTeamIDs) {
    const teamData = sharedManagerTeamData[teamID];
    if (!teamData || !Array.isArray(teamData.createdEmployees)) continue;

    for (const emp of teamData.createdEmployees) {
      if (emp.name) {
        try {
          //Delete employee
          await deleteEmployee(emp.name, "admin");
          console.log(`Deleted employee: ${emp.name}`);
        } catch (err) {
          console.error(`Error deleting ${emp.name}: ${err.message}`);
        }
      }
    }
  }
};
// ------------------------------------------------------------------------------------------

/**
 * Create User Group for test cases
 */
export const createUserGroupForEmployee = async (testCaseID = "TC94") => {
  // Get user email from environment variable
  const user = process.env.EMP3_EMAIL;

  if (!user) {
    console.error("EMP3_EMAIL environment variable is not defined.");
    return;
  }

  // Load the latest shared team data
  const sharedData = await readJSONFile(managerTeamDataFilePath);
  const testCase = sharedData[testCaseID];

  if (!testCase || !testCase.payloadCreateUserGroup) {
    console.warn(`No payloadCreateUserGroup found for test case ${testCaseID}`);
    return;
  }

  // Generate the user group name like "UserGroup-11Jun" which has today's date
  const today = new Date();
  const shortDate = getShortFormattedDate(today); // e.g., "Jun 11"
  const [month, day] = shortDate.split(" ");
  const name = `UserGroup-${day}${month}`; // e.g., UserGroup-11Jun

  const updatedPayload = {
    user,
    name,
  };

  try {
    await createUserGroup(updatedPayload);
    console.log(`  User group '${name}' created for user '${user}'`);

    //Update the test data file
    testCase.payloadCreateUserGroup.user_group_members[0].user = user;
    testCase.payloadCreateUserGroup.__newname = name;
    testCase.payloadDeleteUserGroup.name = name;
    await writeDataToFile(managerTeamDataFilePath, sharedData);
  } catch (err) {
    console.error(` Failed to create user group: ${err.message}`);
  }
};
// ------------------------------------------------------------------------------------------

/**
 * Delete User Group for test cases
 */
export const deleteUserGroupForEmployee = async () => {
  const sharedManagerTeamData = await readJSONFile(managerTeamDataFilePath);
  const managerTeamIDs = ["TC94"]; // Add more test case IDs here if needed

  for (const teamID of managerTeamIDs) {
    const teamData = sharedManagerTeamData[teamID];

    if (!teamData || !teamData.payloadDeleteUserGroup || !teamData.payloadDeleteUserGroup.name) {
      console.warn(`⚠️ Skipping ${teamID} - payloadDeleteUserGroup.name not found.`);
      continue;
    }

    const groupName = teamData.payloadDeleteUserGroup.name;

    try {
      await deleteUserGroup(groupName);
      console.log(`✅ Successfully deleted user group: ${groupName}`);
    } catch (err) {
      if (
        (err && err.response && err.response.status === 404) ||
        (err && typeof err.message === "string" && err.message.includes("404"))
      ) {
        console.warn(`⚠️ No data found for deletion of user group: '${groupName}'`);
      } else {
        console.error(`❌ Failed to delete user group '${groupName}': ${err.message}`);
      }
    }
  }
};
