const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import path from "path";
import { request } from "@playwright/test";
import { baseURL, loadAuthState } from "../../utils/api/apiClient";
import { readJSONFile } from "../../utils/fileUtils";

const API = "/api/method/next_pms.next_projects.api.project";

test.describe("Employee: Projects access", () => {
  test("TC299: The Projects list and project data are refused to an employee by the server", async ({
    jsonDir,
  }) => {
    allure.story("Projects");
    const data = (await readJSONFile(path.join(jsonDir, "TC299.json"))).TC299;
    const project = data.payloadDeleteProject.projectId;
    const context = await request.newContext({
      baseURL,
      storageState: loadAuthState("employee"),
    });
    try {
      for (const [method, params] of [
        ["get_projects_view", { view: "list" }],
        ["get_project_sidebar", { project }],
        ["get_project_tracking", { project }],
      ]) {
        const res = await context.get(`${API}.${method}`, { params });
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
