import { test, expect } from "@playwright/test";
import path from "path";
import { TimelinePage } from "../../pageObjects/resourceManagement/timeline";
import { TeamPage } from "../../pageObjects/resourceManagement/team";
import { ProjectPage } from "../../pageObjects/resourceManagement/project";
import * as allure from "allure-js-commons";
import data from "../../data/manager/team";
import { deleteAllocation } from "../../utils/api/projectRequests";
import { getFormattedDateNDaysFromToday } from "../../utils/dateUtils";

let timelinePage;
let teamPage;
let projectPage;
let createdAllocations = [];

// Load authentication state from 'manager.json'
test.use({ storageState: path.resolve(__dirname, "../../auth/manager.json") });

test.beforeEach(async ({ page }) => {
  timelinePage = new TimelinePage(page);
  teamPage = new TeamPage(page);
  projectPage = new ProjectPage(page);
});

// delete allocations after all tests if not deleted through UI
test.afterAll(async () => {
  for (const allocationName of createdAllocations) {
    try {
      await deleteAllocation(allocationName);
      console.info(`Allocation ${allocationName} deleted through API.`);
    } catch (error) {
      if (error.message.includes("404")) {
        console.info(`Allocation ${allocationName} deleted through UI.`);
      } else {
        console.warn(`Unexpected error while deleting allocation ${allocationName}:`, error);
      }
    }
  }
});

test.describe.only("Manager : Resource Management Tab", () => {
  test("TC-102: Verify add Allocation workflow by the Plus button", async ({ page }) => {
    allure.story("Resource Management");
    const projectName = data.TC102.payloadCreateProject.project_name;
    const employeeName = data.TC102.employee;
    const customerName = data.TC102.payloadCreateProject.customer;
    await timelinePage.goto();
    await timelinePage.isPageVisible();
    const allocationName = await timelinePage.addAllocation(projectName, customerName, employeeName);
    createdAllocations.push(allocationName);
    await expect(page.getByText("Resouce allocation created successfully", { exact: true })).toBeVisible();
    await timelinePage.goto();
    await timelinePage.filterEmployeeByName(employeeName);
    await timelinePage.deleteAllocation(projectName);
    await expect(page.getByText("Resouce allocation deleted successfully", { exact: true })).toBeVisible();
  });

  test("TC-103: Verify add Allocation workflow by clicking on a specfic cell wrt Employee and Date", async ({
    page,
  }) => {
    allure.story("Resource Management");
    const projectName = data.TC103.payloadCreateProject.project_name;
    const employeeName = data.TC103.employee;
    const customerName = data.TC103.payloadCreateProject.customer;
    const { date, day } = getFormattedDateNDaysFromToday(1);
    await teamPage.goto();
    const { allocationName } = await teamPage.addAllocationFromTeamTab(
      projectName,
      customerName,
      employeeName,
      date,
      day
    );
    createdAllocations.push(allocationName);
    await expect(page.getByText("Resouce allocation created successfully", { exact: true })).toBeVisible();
    await teamPage.goto();
    await timelinePage.filterEmployeeByName(employeeName);
    await teamPage.deleteAllocationFromTeamTab(employeeName, date, day);
    await expect(page.getByText("Resouce allocation deleted successfully", { exact: true })).toBeVisible();
  });

  test("TC-104: Verify add Allocation workflow by clicking on a specfic cell wrt Project and Date", async ({
    page,
  }) => {
    allure.story("Resource Management");
    const projectName = data.TC104.payloadCreateProject.project_name;
    const employeeName = data.TC104.employee;
    const customerName = data.TC104.payloadCreateProject.customer;
    const { date, day } = getFormattedDateNDaysFromToday(2);
    await projectPage.goto();
    const { allocationName } = await projectPage.addAllocationFromProjectTab(
      projectName,
      customerName,
      employeeName,
      date,
      day
    );
    createdAllocations.push(allocationName);
    await expect(page.getByText("Resouce allocation created successfully", { exact: true })).toBeVisible();
    await projectPage.goto();
    await projectPage.filterByProject(projectName);
    await projectPage.deleteAllocationFromProjectTab(projectName, date, day);
    await expect(page.getByText("Resouce allocation deleted successfully", { exact: true })).toBeVisible();
  });
});
