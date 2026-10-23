const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import { request } from "@playwright/test";
import { baseURL, loadAuthState } from "../../utils/api/apiClient";
import { getFormattedDate } from "../../utils/dateUtils";
import { gotoWithRetry } from "../../utils/navigation";

const TEAM_API = "/api/method/next_pms.timesheet.api.team";

test.describe("Employee: Team timesheet access", () => {
  test("TC229: Opening the Team timesheet URL as an employee lands on the not-found page", async ({
    page,
  }) => {
    allure.story("Team Timesheet");
    await gotoWithRetry(page, "/next-pms/timesheet/team");
    await expect(page).toHaveURL(/\/next-pms\/not-found/);
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
    await expect(
      page.getByText("Sorry, we couldn't find the page you're looking for."),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Return to Home" }),
    ).toBeVisible();
  });

  test("TC230: The server refuses the Team timesheet data to an employee", async () => {
    allure.story("Team Timesheet");
    const today = getFormattedDate(new Date());
    const context = await request.newContext({
      baseURL,
      storageState: loadAuthState("employee"),
    });
    try {
      for (const [method, params] of [
        ["get_team_timesheet_weeks", { date: today }],
        ["get_team_timesheet_data", { start_date: today }],
      ]) {
        const res = await context.get(`${TEAM_API}.${method}`, { params });
        expect(res.status(), method).toBe(403);
        const body = await res.json();
        expect(body.exc_type, method).toBe("PermissionError");
        expect(body._server_messages, method).toContain(
          "This action is only allowed for",
        );
      }
    } finally {
      await context.dispose();
    }
  });
});
