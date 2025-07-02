import { test, expect } from "@playwright/test";
import path from "path";
import { TimelinePage } from "../../pageObjects/resourceManagement/timeline";
import * as allure from "allure-js-commons";
import data from "../../data/manager/team";

let timelinePage;

// Load authentication state from 'manager.json'
test.use({ storageState: path.resolve(__dirname, "../../auth/manager.json") });

test.beforeEach(async ({ page }) => {
  timelinePage = new TimelinePage(page);

  // navigate to timeline page
  await timelinePage.goto();
  await timelinePage.isPageVisible();
});

test("TC-102: Verify add Allocation workflow by the Plus button", async ({ page }) => {
  allure.story("Resource Management");
  const projectName = data.TC102.payloadCreateProject.project_name;
  const employeeName = data.TC102.employee;
  const customerName = data.TC102.payloadCreateProject.customer;
  await timelinePage.addAllocation(projectName, customerName, employeeName);
  await expect(page.getByText("Resouce allocation created successfully", { exact: true })).toBeVisible();
  await timelinePage.filterEmployeeByName(employeeName);
  await timelinePage.deleteAllocation(projectName);
  await expect(page.getByText("Resouce allocation deleted successfully", { exact: true })).toBeVisible();
});
