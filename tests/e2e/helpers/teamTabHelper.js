import path from "path";
import { getFormattedDate, getDateForWeekday } from "../utils/dateUtils";
import managerTeamData from "../data/manager/team.json";
import { readJSONFile } from "../utils/fileUtils";
import { deleteEmployee } from "../utils/api/employeeRequests";
import { getRandomValue } from "../utils/stringUtils";
import { submitTimesheetForApproval } from "./timesheetHelper";
import { actOnTimesheet } from "../utils/api/timesheetRequests";
import { writeDataToFile } from "../utils/fileUtils";
// Load env variables
const managerId = process.env.REP_MAN_ID;
const managerName = process.env.REP_MAN_NAME;
const managerMail = process.env.REP_MAN_EMAIL;
const emp3ID = process.env.EMP3_ID;

// Define file paths for shared JSON data files
const managerTeamDataFilePath = path.resolve(__dirname, "../data/manager/shared-team.json"); // File path of the manager team data JSON file

// Global variables to store shared data and reused across functions
let sharedManagerTeamData;

// ------------------------------------------------------------------------------------------

/**
 * Create a random Approval Status timesheet for an Active employee
 */
export const randomApprovalStatus = async (
  data = managerTeamData,
  //employeeStatus = ["Active"],
  approvalStatus = ["Approval Pending", "Rejected"],
  testCases = ["TC92"]
) => {
  //Get a random Approval Status
  const randomApprovalStatus = getRandomValue(approvalStatus);
  console.warn(`Selected RANDOM Approval Status: ${randomApprovalStatus}`);

  const processTestCasesForApprovalStatus = async (data, randomApprovalStatus, testCases) => {
    for (const testCaseID of testCases) {
      const testCase = data[testCaseID];
      //Store the random approval status in the json file
      testCase.payloadApprovalStatus.approvalStatus = randomApprovalStatus;

      //Submit timesheet for Approval
      await submitTimesheetForApproval(
        testCase.payloadApprovalStatus.empId,
        testCase.payloadApprovalStatus.managerID,
        testCase.payloadApprovalStatus.employeeAPI,
      );
      switch (randomApprovalStatus) {
        case "Approval Pending":
          console.warn("CASE: Approval Pending");
          break;

        case "Rejected":
          console.warn("CASE: Rejected");
          //Convert the timesheet entry day to a proper date
          const formattedDate = getFormattedDate(getDateForWeekday(testCase.cell.col));

          await actOnTimesheet({
            dates: [formattedDate], // or multiple dates if needed
            employee: testCase.payloadApprovalStatus.empId,
            note: "rejecting timesheet via API",
            status: randomApprovalStatus,
          });
          break;
      }
    }
  };
  await processTestCasesForApprovalStatus(data, randomApprovalStatus, testCases);
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
