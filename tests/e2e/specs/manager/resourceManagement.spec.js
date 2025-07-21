const { test, expect } = require("../../playwright.fixture.cjs");
import path from "path";
import { TimelinePage } from "../../pageObjects/resourceManagement/timeline";
import { TeamPage } from "../../pageObjects/resourceManagement/team";
import { ProjectPage } from "../../pageObjects/resourceManagement/project";
import * as allure from "allure-js-commons";
import { deleteAllocation } from "../../utils/api/projectRequests";
import { getFormattedDateNDaysFromToday, getFormattedPastWorkday } from "../../utils/dateUtils";
import { readJSONFile } from "../../utils/fileUtils";

let timelinePage;
let teamPage;
let projectPage;
let createdAllocations = [];

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

test.describe("Manager : Resource Management Tab", () => {
  test("TC102: Verify add Allocation workflow by the Plus button", async ({ page, jsonDir }) => {
    allure.story("Resource Management");
    const stubPath = path.join(jsonDir, "TC102.json");
    const data = await readJSONFile(stubPath);
    const TC102data = data.TC102;
    const projectName = TC102data.payloadCreateProject.project_name;
    const employeeName = TC102data.employee;
    const customerName = TC102data.payloadCreateProject.customer;
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

  test("TC103: Verify add Allocation workflow by clicking on a specfic cell wrt Employee and Date", async ({
    page,
    jsonDir,
  }) => {
    allure.story("Resource Management");
    const stubPath = path.join(jsonDir, "TC103.json");
    const data = await readJSONFile(stubPath);
    const TC103data = data.TC103;

    const projectName = TC103data.payloadCreateProject.project_name;
    const employeeName = TC103data.employee;
    const customerName = TC103data.payloadCreateProject.customer;
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

  test("TC104: Verify add Allocation workflow by clicking on a specfic cell wrt Project and Date", async ({
    page,
    jsonDir,
  }) => {
    allure.story("Resource Management");
    const stubPath = path.join(jsonDir, "TC104.json");
    const data = await readJSONFile(stubPath);
    const TC104data = data.TC104;

    const projectName = TC104data.payloadCreateProject.project_name;
    const employeeName = TC104data.employee;
    const customerName = TC104data.payloadCreateProject.customer;
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

  test("TC107: Verify adding allocation on a past day", async ({ page, jsonDir }) => {
    allure.story("Resource Management");
    const stubPath = path.join(jsonDir, "TC107.json");
    const data = await readJSONFile(stubPath);
    const TC107data = data.TC107;

    const projectName = TC107data.payloadCreateProject.project_name;
    const employeeName = TC107data.employee;
    const customerName = TC107data.payloadCreateProject.customer;
    const { date } = getFormattedPastWorkday(-1);
    await projectPage.goto();
    const allocationName = await projectPage.addAllocation(projectName, customerName, employeeName, date);
    createdAllocations.push(allocationName);
    await expect(page.getByText("Resouce allocation created successfully", { exact: true })).toBeVisible();
    await projectPage.goto();
    await projectPage.filterByProject(projectName);
    // await projectPage.deleteAllocationFromProjectTab(projectName, date, day);
    // await expect(page.getByText("Resouce allocation deleted successfully", { exact: true })).toBeVisible();
  });

  test("TC108: Verify adding allocation from the clipboard icon", async ({ page, jsonDir }) => {
    allure.story("Resource Management");

    const stubPath = path.join(jsonDir, "TC108.json");
    const data = await readJSONFile(stubPath);
    const TC108data = data.TC108;

    const projectName = TC108data.payloadCreateProject.project_name;
    const employeeName = TC108data.employee;
    const customerName = TC108data.payloadCreateProject.customer;
    const { date, day } = getFormattedDateNDaysFromToday(3);
    await projectPage.goto();
    const { allocationName } = await projectPage.addAllocationFromProjectTab(
      projectName,
      customerName,
      employeeName,
      date,
      day,
      "4"
    );
    createdAllocations.push(allocationName);
    await expect(page.getByText("Resouce allocation created successfully", { exact: true })).toBeVisible();
    await projectPage.goto();
    await projectPage.filterByProject(projectName);
    await projectPage.clickClipboardIcon(projectName, date, day);
    await projectPage.addAllocationFromProjectTabFromClipboard("8");
    await expect(page.getByText("Resouce allocation created successfully", { exact: true })).toBeVisible();
  });

  test("TC109: Verify Changing/updating the billable/non billable on a project allocation", async ({
    page,
    jsonDir,
  }) => {
    allure.story("Resource Management");

    const stubPath = path.join(jsonDir, "TC109.json");
    const data = await readJSONFile(stubPath);
    const TC109data = data.TC109;

    const projectName = TC109data.payloadCreateProject.project_name;
    const employeeName = TC109data.employee;
    const customerName = TC109data.payloadCreateProject.customer;
    const { date, day } = getFormattedDateNDaysFromToday(6);
    await projectPage.goto();
    const { allocationName } = await projectPage.addAllocationFromProjectTab(
      projectName,
      customerName,
      employeeName,
      date,
      day,
      "4"
    );
    createdAllocations.push(allocationName);
    await projectPage.goto();
    await projectPage.filterByProject(projectName);
    await projectPage.clickEditIcon(projectName, date, day);
    await projectPage.clickOnBillableToggle();
    await projectPage.clickSaveButton();
    await expect(page.getByText("Resouce allocation updated successfully", { exact: true })).toBeVisible();
  });

  test("TC110: Verify Editing a time allocation", async ({ page, jsonDir }) => {
    allure.story("Resource Management");

    const stubPath = path.join(jsonDir, "TC110.json");
    const data = await readJSONFile(stubPath);
    const TC110data = data.TC110;

    const projectName = TC110data.payloadCreateProject.project_name;
    const employeeName = TC110data.employee;
    const customerName = TC110data.payloadCreateProject.customer;
    const updatedHours = "8";
    const { date, day } = getFormattedDateNDaysFromToday(7);
    await projectPage.goto();
    const { allocationName } = await projectPage.addAllocationFromProjectTab(
      projectName,
      customerName,
      employeeName,
      date,
      day,
      "4"
    );
    createdAllocations.push(allocationName);
    await projectPage.goto();
    await projectPage.filterByProject(projectName);
    await projectPage.clickEditIcon(projectName, date, day);
    await projectPage.editAllocationFromProjectTab(updatedHours, updatedHours);
    await projectPage.clickSaveButton();
    await expect(page.getByText("Resouce allocation updated successfully", { exact: true })).toBeVisible();
    let allocationTime = await projectPage.getAllocationFromProjectTab(projectName, date, day);
    expect(allocationTime).toEqual(updatedHours);
  });

  test("TC111: Allocation for more than 8 hours per day / allocation of more than 24 hours per day.", async ({
    jsonDir,
  }) => {
    allure.story("Resource Management");

    const stubPath = path.join(jsonDir, "TC111.json");
    const data = await readJSONFile(stubPath);
    const TC111data = data.TC111;

    const projectName = TC111data.payloadCreateProject.project_name;
    const employeeName = TC111data.employee;
    const customerName = TC111data.payloadCreateProject.customer;
    const updatedHours = "25";
    const { date, day } = getFormattedDateNDaysFromToday(8);
    await projectPage.goto();
    const { allocationName } = await projectPage.addAllocationFromProjectTab(
      projectName,
      customerName,
      employeeName,
      date,
      day,
      "10"
    );
    createdAllocations.push(allocationName);
    await projectPage.goto();
    await projectPage.filterByProject(projectName);
    await projectPage.clickEditIcon(projectName, date, day);
    await projectPage.editAllocationFromProjectTab(updatedHours, updatedHours);
    const erroMessage = await projectPage.getErrorFromAllocationModal();
    expect(erroMessage).toEqual("Hour / Day should be less than 24");
  });
});
