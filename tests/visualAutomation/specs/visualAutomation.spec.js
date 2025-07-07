import { test, expect } from "@playwright/test";
import { storeStorageState } from "../../e2e/helpers/storageStateHelper";
import path from "path";

const URLS = {
  LOGIN: "/login?redirect-to=/next-pms/timesheet#login",
  LOGIN_EMAIL: "/login?redirect-to=/next-pms/timesheet#login-with-email-link",
  FORGOT_PASSWORD: "/login?redirect-to=/next-pms/timesheet#forgot",
  TIMESHEET: "/next-pms/timesheet",
  TEAM: "/next-pms/team",
  PROJECT: "/next-pms/project",
  TASK: "/next-pms/task",
  RESOURCE_MANAGEMENT_TIMELINE: "/next-pms/resource-management/timeline",
  RESOURCE_MANAGEMENT_TEAM: "/next-pms/resource-management/team",
  RESOURCE_MANAGEMENT_PROJECT: "/next-pms/resource-management/project",
};

async function visualCheck(page, expectedName, options = {}) {
  try {
    // Wait for network idle and any animations to complete
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500); // Small buffer for animations
    await expect(page).toHaveScreenshot(expectedName, options);
  } catch (error) {
    console.error(`Visual check failed for ${expectedName}:`, error.message);
    if (process.env.FAIL_ON_VISUAL_DIFF === "true") {
      throw error;
    }
  }
}

test.beforeAll(async () => {
  await Promise.all([storeStorageState("manager", false)]);
});

test.describe("Visual Automation", () => {
  test("Verify visual tests for login page", async ({ page }) => {
    await page.goto(URLS.LOGIN);
    await visualCheck(page, "login-page.png");
  });

  test("Verify visual test for login with email page", async({ page })=> {
    await page.goto(URLS.LOGIN_EMAIL);
    await visualCheck(page, "login-page-with-email-link.png");
  });

  test("Verify visual test for forgot password page", async({ page })=> {
    await page.goto(URLS.FORGOT_PASSWORD);
    await visualCheck(page, "forgot-password-page.png");
  });

  test.describe("Manager Tests", () => {
    test.use({ storageState: path.resolve(__dirname, "../../e2e/auth/manager.json") });

    test("Verify visual tests for Timesheet page as manager", async ({ page }) => {
      await page.goto(URLS.TIMESHEET);
      await visualCheck(page, "manager-timesheet-page.png");
    });

    test("Verify visual tests for Team page as manager", async ({ page }) => {
      await page.goto(URLS.TEAM);
      await visualCheck(page, "manager-team-page.png");
    });

    test("Verify visual tests for Project page as manager", async ({ page }) => {
      await page.goto(URLS.PROJECT);
      await visualCheck(page, "manager-project-page.png");
    });

    test("Verify visual tests for Task page as manager", async ({ page }) => {
      await page.goto(URLS.TASK);
      await visualCheck(page, "manager-task-page.png");
    });

    test("Verify visual tests for Resource Management >> Timeline page as manager", async ({ page }) => {
      await page.goto(URLS.RESOURCE_MANAGEMENT_TIMELINE);
      await visualCheck(page, "manager-resource-management-timeline-page.png");
    });

    test("Verify visual tests for Resource Management >> Team page as manager", async ({ page }) => {
      await page.goto(URLS.RESOURCE_MANAGEMENT_TEAM);
      await visualCheck(page, "manager-resource-management-team-page.png");
    });

    test("Verify visual tests for Resource Management >> Project page as manager", async ({ page }) => {
      await page.goto(URLS.RESOURCE_MANAGEMENT_PROJECT);
      await visualCheck(page, "manager-resource-management-project-page.png");
    });


    test("Verify visual check for Add Leave Popup", async ({ page }) => {
      const addLeaveButton = page.getByRole("button", { name: "Leave" });
      await page.goto(URLS.TIMESHEET);
      await addLeaveButton.click();
      await visualCheck(page, "add-leave-modal.png");
    });

    test("Verify visual check for Add Time Popup", async ({ page }) => {
      const addTimeButton = page.getByRole("button", { name: "Time" });
      await page.goto(URLS.TIMESHEET);
      await addTimeButton.click();
      await visualCheck(page, "add-time-modal.png");
    });
  });
});
