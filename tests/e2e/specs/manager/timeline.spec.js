import { test, expect } from '@playwright/test';
import path from "path";
import { TimelinePage } from "../../pageObjects/resourceManagement/timeline";
import * as allure from "allure-js-commons";

let timelinePage;
const projectName = 'Nextivia';
const employeeName = 'abhishek sharma';
const customerName = 'google';

// Load authentication state from 'manager.json'
test.use({ storageState: path.resolve(__dirname, "../../auth/manager.json") });

test.beforeEach(async ({ page }) => {
    timelinePage = new TimelinePage(page);

    // navigate to timeline page
    await timelinePage.goto();
    await timelinePage.isPageVisible();
});

test("TC-102: Verify add Allocation workflow by the Plus button", async ({ page }) => {
    allure.story("Timeline");
    await timelinePage.clickAddAllocationButton();
    await timelinePage.selectEmployee(employeeName);
    await timelinePage.selectCustomer(customerName);
    await timelinePage.selectProject(projectName);
    await timelinePage.addDateRange();
    await timelinePage.setHoursPerDay("8");
    await timelinePage.clickCreateButton();
    await expect(page.getByText('Resouce allocation created successfully', { exact: true })).toBeVisible();
    await timelinePage.filterEmployee(employeeName);
    await page.waitForTimeout(1000);
    await timelinePage.deleteAllocation();
    await expect(page.getByText("Resouce allocation deleted successfully", { exact: true })).toBeVisible();
});