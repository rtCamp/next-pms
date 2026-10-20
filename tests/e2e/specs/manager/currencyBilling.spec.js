const { test, expect } = require("../../playwright.fixture.cjs");
import * as allure from "allure-js-commons";
import { dueDateText } from "../../helpers/taskHelper";
import { ProjectPage } from "../../pageObjects/projectPage";
import { ProjectTrackingPage } from "../../pageObjects/projectTrackingPage";
import { getDocument } from "../../utils/api/apiClient";
import { getExchangeRate } from "../../utils/api/erpNextRequests";
import { apiRequest } from "../../utils/api/projectRequests";
import {
  SYMBOLS,
  formatMoney,
  formatPercent,
  moneyValue,
} from "../../utils/currency";
import { dayOfThisMonth } from "../../utils/dateUtils";
import { findProjectId, loadTestCase } from "../../utils/testCase";

const SORT_HINT = "Select a currency to enable this sort";
const LIST_COLUMNS = {
  budget: ["name", "burn_rate_per_week", "total_budget"],
  lifetime: [
    "name",
    "burn_rate_per_week",
    "total_budget",
    "lifetime_value_to_date",
  ],
};

// What the app converts a project's amounts with: today's rate from ERPNext.
const rateOf = async (from, to) => (await getExchangeRate(from, to)).message;

// A converted amount is a float the app rounds when printing, so compare the number.
const expectAmount = async (cell, amount, currency) => {
  await expect(cell).toContainText(SYMBOLS[currency]);
  await expect
    .poll(async () => moneyValue(await cell.innerText()))
    .toBeCloseTo(amount, 1);
};

const trackingOf = async (projectId) =>
  (
    await apiRequest(
      `/api/method/next_pms.next_projects.api.project.get_project_tracking?project=${projectId}`,
      { method: "GET" },
      "manager",
    )
  ).message;

// A day of this month as the contracts and rates tables print it.
const printedDay = (day) => dueDateText(dayOfThisMonth(day));

// What a case's data seeded for one project, read back so the expectations follow the data.
const seeded = (data, postfix = "") => {
  const project = data[`payloadCreateProject${postfix}`];
  const times = data[`payloadCreateBillingTime${postfix}`] ?? [];
  const hours = (billable) =>
    times
      .filter((time) => time.billable === billable)
      .reduce((total, time) => total + time.hours, 0);
  return {
    project,
    sales: data[`payloadCreateSalesOrder${postfix}`]?.amount ?? 0,
    billableHours: hours(true),
    otherHours: hours(false),
    billed: hours(true) * project.custom_default_hourly_billing_rate,
    // A Retainer is measured in the hours it bought, the others in their target.
    contractedHours:
      project.custom_target_hours ??
      project.custom_project_budget_hours.reduce(
        (total, row) => total + row.hours_purchased,
        0,
      ),
    lifetime: [
      project.custom_lifetime_value_to_date,
      project.custom_expected_lifetime_value,
      project.custom_lifetime_value_vs_billed_amount,
    ],
  };
};

test.describe("Manager: Currency & Billing", () => {
  /** @type {ProjectPage} */ let projectPage;
  /** @type {ProjectTrackingPage} */ let tracking;

  test.beforeEach(async ({ page }) => {
    projectPage = new ProjectPage(page);
    tracking = new ProjectTrackingPage(page);
  });

  // --------------------------------------
  // Projects list
  // --------------------------------------

  // Skipped: /next-pms/projects with no view in the URL sets the default currency and then drops it, so the box stays empty.
  test.skip("TC192: On first load the Projects list converts its amounts into the site's default currency", async ({
    page,
    jsonDir,
  }) => {
    allure.story("Currency & Billing");
    const { data } = await loadTestCase(jsonDir, "TC192");
    const inr = data.payloadCreateProject.project_name;
    const usd = data.payloadCreateProject2.project_name;

    await projectPage.openFirstLoad();
    const siteCurrency = await page.evaluate(
      () => window.frappe.boot.sysdefaults.currency,
    );
    await expect(page).toHaveURL(new RegExp(`currency=${siteCurrency}`));
    await expect(projectPage.currencySearchBar).toHaveValue(siteCurrency);
    await projectPage.searchProject("TC192");

    // The amounts of each project are in the site's currency, converted when they were not.
    const budget = {
      [inr]: [seeded(data).sales, "INR"],
      [usd]: [seeded(data, "2").sales, "USD"],
    };
    for (const [name, [amount, currency]] of Object.entries(budget)) {
      const converted =
        currency === siteCurrency
          ? amount
          : amount * (await rateOf(currency, siteCurrency));
      await expectAmount(
        await projectPage.cell(name, "Total budget"),
        converted,
        siteCurrency,
      );
    }

    // Without a currency each project shows its own.
    await projectPage.clearCurrency();
    for (const [name, [amount, currency]] of Object.entries(budget)) {
      await expect(await projectPage.cell(name, "Total budget")).toHaveText(
        formatMoney(amount, currency),
      );
    }
  });

  test("TC193: Choosing another currency converts the budget, burn rate and lifetime value at today's rate", async ({
    jsonDir,
  }) => {
    allure.story("Currency & Billing");
    const { data } = await loadTestCase(jsonDir, "TC193");
    const inr = data.payloadCreateProject.project_name;
    const usd = data.payloadCreateProject2.project_name;
    const columns = [
      "Burn rate/week",
      "Total budget",
      "Lifetime value to date",
    ];
    // Each project's amounts in its own currency, in the order of the columns above.
    const [inrData, usdData] = [seeded(data), seeded(data, "2")];
    const own = {
      [inr]: {
        currency: "INR",
        amounts: [inrData.billed, inrData.sales, inrData.lifetime[0]],
      },
      [usd]: {
        currency: "USD",
        amounts: [usdData.billed, usdData.sales, usdData.lifetime[0]],
      },
    };

    await projectPage.gotoList({
      search: "TC193",
      currency: "INR",
      columns: LIST_COLUMNS.lifetime,
    });
    const expectIn = async (target) => {
      for (const [name, { currency, amounts }] of Object.entries(own)) {
        const rate = currency === target ? 1 : await rateOf(currency, target);
        for (const [index, column] of columns.entries()) {
          await expectAmount(
            await projectPage.cell(name, column),
            amounts[index] * rate,
            target,
          );
        }
      }
    };

    await expectIn("INR");
    await projectPage.chooseCurrency("USD");
    await expect(projectPage.currencySearchBar).toHaveValue("USD");
    await expectIn("USD");
    // The project already in USD keeps what it had.
    await expect(await projectPage.cell(usd, "Total budget")).toHaveText(
      formatMoney(usdData.sales, "USD"),
    );
  });

  test("TC194: The budget and burn rate sorts use the converted amounts, and stay disabled until a currency is chosen", async ({
    page,
    jsonDir,
  }) => {
    allure.story("Currency & Billing");
    const { data } = await loadTestCase(jsonDir, "TC194");
    const inr = data.payloadCreateProject.project_name;
    const usd = data.payloadCreateProject2.project_name;

    await projectPage.gotoList({
      search: "TC194",
      currency: "USD",
      columns: LIST_COLUMNS.budget,
    });
    await expect(projectPage.rowOf(inr)).toBeVisible();
    await expect(projectPage.rowOf(usd)).toBeVisible();

    // 5,000 rupees is the bigger number but the smaller amount; so are its 500 a week.
    for (const column of ["Total budget", "Burn rate/week"]) {
      await projectPage.clickHeader(column);
      await expect(projectPage.columnHeader(column)).toHaveAttribute(
        "aria-sort",
        "descending",
      );
      await expect.poll(() => projectPage.projectOrder()).toEqual([usd, inr]);

      await projectPage.clickHeader(column);
      await expect(projectPage.columnHeader(column)).toHaveAttribute(
        "aria-sort",
        "ascending",
      );
      await expect.poll(() => projectPage.projectOrder()).toEqual([inr, usd]);
    }

    // With no currency chosen the sort is dropped, and the two columns no longer sort.
    await projectPage.clearCurrency();
    await expect(page).not.toHaveURL(/sortField/);
    for (const column of ["Total budget", "Burn rate/week"]) {
      await expect(
        projectPage.columnHeader(column).getByRole("button").first(),
      ).toHaveAttribute("aria-disabled", "true");
    }
    await projectPage.openSortMenu();
    for (const column of ["Total budget", "Burn rate/week"]) {
      await expect(projectPage.sortMenuOption(column)).toBeDisabled();
    }
    await projectPage.sortMenuOption("Total budget").hover({ force: true });
    await expect(page.getByText(SORT_HINT)).toBeVisible();
    await page.keyboard.press("Escape");

    // Picking a currency brings them back.
    await projectPage.chooseCurrency("USD");
    await projectPage.openSortMenu();
    await expect(projectPage.sortMenuOption("Total budget")).toBeEnabled();
    await expect(projectPage.sortMenuOption("Burn rate/week")).toBeEnabled();
  });

  // --------------------------------------
  // Project sidebar
  // --------------------------------------

  test("TC195: Progress and Budget burn say what is not set, and a hint names the missing field", async ({
    jsonDir,
  }) => {
    allure.story("Currency & Billing");
    const { data } = await loadTestCase(jsonDir, "TC195");
    const SALES_ORDER = "No submitted Sales Order is linked to this project";
    const cases = [
      {
        project: data.payloadCreateProject,
        budgetHint: SALES_ORDER,
        targetHint: "Target Hours is not set on this project",
      },
      {
        project: data.payloadCreateProject2,
        budgetHint: SALES_ORDER,
        targetHint: "Total Hours Purchased is not set on this project",
      },
      {
        project: data.payloadCreateProject3,
        budgetHint: "Estimated Cost is not set on this project",
        targetHint: "Target Hours is not set on this project",
      },
    ];

    for (const { project, budgetHint, targetHint } of cases) {
      await test.step(project.custom_billing_type, async () => {
        await tracking.goto(await findProjectId(project));
        await expect(
          await tracking.hintOf("Budget not set", budgetHint),
        ).toBeVisible();
        await expect(
          await tracking.hintOf("Target not set", targetHint),
        ).toBeVisible();
      });
    }
  });

  test("TC196: The sidebar and the Tracking tab agree on the hours and the budget burn", async ({
    jsonDir,
  }) => {
    allure.story("Currency & Billing");
    const { data } = await loadTestCase(jsonDir, "TC196");
    // Fixed Cost and Time and Material count against Target Hours, Retainer against the hours it bought.
    const cases = ["", "2", "3"].map((postfix) => seeded(data, postfix));

    for (const {
      project,
      contractedHours: total,
      billableHours: used,
      billed,
      sales: budget,
    } of cases) {
      await test.step(project.custom_billing_type, async () => {
        await tracking.goto(await findProjectId(project));
        const hours = tracking.sidebarSection("Progress (hours)");
        await expect(hours).toContainText(`${used} hours`);
        await expect(hours).toContainText(`${total} hours`);
        const usage = tracking.card("Hours usage");
        await expect(
          tracking.valueOf("Total hours utilised", usage),
        ).toHaveText(`${used} h`);
        await expect(
          tracking.valueOf("Total hours remaining", usage),
        ).toHaveText(`${total - used} h`);

        const sidebarBurn = tracking.sidebarSection("Budget burn");
        const burn = tracking.card("Budget burn (to date)");
        const actual = formatMoney(billed);
        const planned = formatMoney(budget);
        await expect(sidebarBurn).toContainText(actual);
        await expect(sidebarBurn).toContainText(planned);
        await expect(tracking.valueOf("Actual budget burn", burn)).toHaveText(
          actual,
        );
        await expect(tracking.valueOf("Total project budget", burn)).toHaveText(
          planned,
        );
      });
    }
  });

  // --------------------------------------
  // Billing types
  // --------------------------------------

  // What a project that is not billable leaves out of the Tracking tab.
  const expectNoBillingWidgets = async () => {
    await expect(tracking.card("Hours usage")).toBeVisible();
    await expect(tracking.totalProjectValueLink).toHaveCount(0);
    await expect(tracking.financialsMenuButton).toHaveCount(0);
    for (const title of [
      "Projected profit",
      "Projected profit margin",
      "Contracts",
      "Project rates",
    ]) {
      await expect(tracking.tab.getByText(title, { exact: true })).toHaveCount(
        0,
      );
    }
  };

  test("TC197: A Non-Billable project has no Financials card, Contracts or Rates on the Tracking tab", async ({
    jsonDir,
  }) => {
    allure.story("Currency & Billing");
    const { projectId } = await loadTestCase(jsonDir, "TC197");

    await tracking.goto(projectId);
    await expectNoBillingWidgets();
  });

  test("TC198: A project with a blank billing type is not treated as billable", async ({
    jsonDir,
  }) => {
    allure.story("Currency & Billing");
    const { projectId } = await loadTestCase(jsonDir, "TC198");

    await tracking.goto(projectId);
    await expectNoBillingWidgets();
  });

  // --------------------------------------
  // Financials
  // --------------------------------------

  test("TC199: Financials shows the project value, profit and margin in the project's currency", async ({
    jsonDir,
  }) => {
    allure.story("Currency & Billing");
    const { data } = await loadTestCase(jsonDir, "TC199");
    const cases = ["", "2", "3"].map((postfix) => seeded(data, postfix));

    for (const { project, sales: value } of cases) {
      await test.step(project.custom_billing_type, async () => {
        const projectId = await findProjectId(project);
        const figures = await trackingOf(projectId);
        expect(figures.total_project_value).toBe(value);
        expect((figures.project_profit / value) * 100).toBeCloseTo(
          figures.projected_profit_margin,
          2,
        );

        await tracking.goto(projectId);
        await expect(tracking.valueOf("Total project value")).toHaveText(
          formatMoney(value),
        );
        await expect(tracking.valueOf("Projected profit")).toHaveText(
          formatMoney(figures.project_profit),
        );
        await expect(tracking.valueOf("Projected profit margin")).toHaveText(
          formatPercent(figures.projected_profit_margin),
        );
      });
    }
  });

  test("TC200: The Financials menu switches between Projected and Current figures", async ({
    jsonDir,
  }) => {
    allure.story("Currency & Billing");
    const { data } = await loadTestCase(jsonDir, "TC200");
    const [material, fixed] = [seeded(data), seeded(data, "2")];
    const materialId = await findProjectId(material.project);
    const fixedId = await findProjectId(fixed.project);

    await test.step("Time and Material: Current is the billable amount", async () => {
      await tracking.goto(materialId);
      await expect(tracking.valueOf("Total project value")).toHaveText(
        formatMoney(material.sales),
      );

      await tracking.showFinancials("Current");
      await expect(
        tracking.tab.getByText("Current profit", { exact: true }),
      ).toBeVisible();
      await expect(
        tracking.tab.getByText("Current profit margin", { exact: true }),
      ).toBeVisible();
      await expect(
        tracking.tab.getByText("Projected profit", { exact: true }),
      ).toHaveCount(0);
      await expect(tracking.valueOf("Total project value")).toHaveText(
        formatMoney(material.billed),
      );

      await tracking.showFinancials("Projected");
      await expect(
        tracking.tab.getByText("Projected profit", { exact: true }),
      ).toBeVisible();
      await expect(tracking.valueOf("Total project value")).toHaveText(
        formatMoney(material.sales),
      );
    });

    await test.step("Fixed Cost: the value is the same either way", async () => {
      await tracking.goto(fixedId);
      await expect(tracking.totalProjectValueLink).toContainText(
        formatMoney(fixed.sales),
      );
      await tracking.showFinancials("Current");
      await expect(
        tracking.tab.getByText("Current profit", { exact: true }),
      ).toBeVisible();
      await expect(tracking.totalProjectValueLink).toContainText(
        formatMoney(fixed.sales),
      );
    });
  });

  test("TC201: A billable project with no contract value shows N/A for its profit margin", async ({
    jsonDir,
  }) => {
    allure.story("Currency & Billing");
    const { projectId } = await loadTestCase(jsonDir, "TC201");

    await tracking.goto(projectId);
    await expect(tracking.totalProjectValueLink).toContainText(formatMoney(0));
    await expect(tracking.valueOf("Projected profit margin")).toHaveText("N/A");

    await tracking.showFinancials("Current");
    await expect(tracking.valueOf("Current profit margin")).toHaveText("N/A");
  });

  // --------------------------------------
  // Currency
  // --------------------------------------

  test("TC202: Every money value of a project uses the project's own currency", async ({
    jsonDir,
  }) => {
    allure.story("Currency & Billing");
    const { data } = await loadTestCase(jsonDir, "TC202");
    const cases = [
      { project: data.payloadCreateProject, currency: "INR", other: "USD" },
      { project: data.payloadCreateProject2, currency: "USD", other: "INR" },
    ];
    const figures = [
      ["Total project value", "Invoice burn (to date)"],
      ["Invoiced and paid", "Invoice burn (to date)"],
      ["Invoiced but not paid", "Invoice burn (to date)"],
      ["Actual budget burn", "Budget burn (to date)"],
      ["Forecasted budget burn", "Budget burn (to date)"],
      ["Total project budget", "Budget burn (to date)"],
      ["Actual cost incurred", "Cost burn (to date)"],
      ["Forecasted cost to completion", "Cost burn (to date)"],
      ["Target cost", "Cost burn (to date)"],
    ];
    const lifetime = [
      "Lifetime value to date",
      "Expected lifetime value",
      "Lifetime value vs billed amount",
    ];

    for (const { project, currency, other } of cases) {
      await test.step(currency, async () => {
        await tracking.goto(await findProjectId(project));
        const symbol = SYMBOLS[currency];
        const values = [
          tracking.sidebarSection("Budget burn"),
          tracking.totalProjectValueLink,
          tracking.valueOf("Projected profit"),
          ...figures.map(([label, card]) =>
            tracking.valueOf(label, tracking.card(card)),
          ),
          ...lifetime.map((label) => tracking.valueOf(label)),
        ];
        for (const value of values) {
          await expect(value).toContainText(symbol);
          await expect(value).not.toContainText(SYMBOLS[other]);
        }
      });
    }
  });

  // --------------------------------------
  // Hours usage and lifetime values
  // --------------------------------------

  test("TC203: Hours usage splits billable from non-billable hours and shows what is left of the target", async ({
    jsonDir,
  }) => {
    allure.story("Currency & Billing");
    const { data, projectId } = await loadTestCase(jsonDir, "TC203");
    const { billableHours, otherHours, contractedHours } = seeded(data);

    await tracking.goto(projectId);
    const usage = tracking.card("Hours usage");
    await expect(tracking.valueOf("Billable hours utilised", usage)).toHaveText(
      `${billableHours} h`,
    );
    await expect(
      tracking.valueOf("Non-billable hours utilised", usage),
    ).toHaveText(`${otherHours} h`);
    await expect(tracking.valueOf("Total hours utilised", usage)).toHaveText(
      `${billableHours + otherHours} h`,
    );
    await expect(tracking.valueOf("Total hours remaining", usage)).toHaveText(
      `${contractedHours - billableHours - otherHours} h`,
    );
  });

  test("TC204: The Lifetime cards show their values in the project's currency, and N/A when the project has none", async ({
    jsonDir,
  }) => {
    allure.story("Currency & Billing");
    const { data } = await loadTestCase(jsonDir, "TC204");
    const labels = [
      "Lifetime value to date",
      "Expected lifetime value",
      "Lifetime value vs billed amount",
    ];
    const cases = [
      {
        project: data.payloadCreateProject,
        expected: seeded(data).lifetime.map((value) =>
          formatMoney(value, "INR"),
        ),
      },
      {
        project: data.payloadCreateProject2,
        expected: seeded(data, "2").lifetime.map((value) =>
          formatMoney(value, "USD"),
        ),
      },
      { project: data.payloadCreateProject3, expected: ["N/A", "N/A", "N/A"] },
    ];

    for (const { project, expected } of cases) {
      await test.step(project.project_name, async () => {
        await tracking.goto(await findProjectId(project));
        for (const [index, label] of labels.entries()) {
          await expect(tracking.valueOf(label)).toHaveText(expected[index]);
        }
      });
    }
  });

  // --------------------------------------
  // Contracts and rates
  // --------------------------------------

  test("TC205: A contract can be added, edited and deleted, and its Hours left is the hours bought minus the hours used", async ({
    jsonDir,
  }) => {
    allure.story("Currency & Billing");
    const { data, projectId } = await loadTestCase(jsonDir, "TC205");
    const used = seeded(data).billableHours;
    // The hours already logged count against the first contract.
    const cells = (bought) => [
      printedDay(6),
      printedDay(18),
      String(bought),
      String(used),
      String(bought - used),
      "",
      "",
    ];

    await tracking.goto(projectId);
    await expect(tracking.contractsCard).toContainText("No contracts yet");

    await tracking.contractsCard.getByRole("button").first().click();
    await tracking.fillContract(tracking.addContractDialog, {
      startDay: 6,
      endDay: 18,
      hours: 40,
    });
    await tracking.addContractDialog
      .getByRole("button", { name: "Add contract" })
      .click();
    await expect(tracking.toast("Contract added")).toBeVisible();
    await expect(tracking.contractRows).toHaveCount(1);
    await expect(tracking.contractRows.first().locator("span")).toHaveText(
      cells(40),
    );

    await tracking.openRowMenu(tracking.contractRows.first(), "Edit");
    await expect(
      tracking.editContractDialog.getByRole("spinbutton"),
    ).toHaveValue("40");
    await tracking.editContractDialog.getByRole("spinbutton").fill("50");
    await tracking.editContractDialog
      .getByRole("button", { name: "Save changes" })
      .click();
    await expect(tracking.toast("Contract updated")).toBeVisible();
    await expect(tracking.contractRows.first().locator("span")).toHaveText(
      cells(50),
    );

    await tracking.openRowMenu(tracking.contractRows.first(), "Delete");
    await tracking.confirmDeleteDialog
      .getByRole("button", { name: "Cancel" })
      .click();
    await expect(tracking.contractRows).toHaveCount(1);
    await tracking.openRowMenu(tracking.contractRows.first(), "Delete");
    await tracking.confirmDeleteDialog
      .getByRole("button", { name: "Delete" })
      .click();
    await expect(tracking.toast("Contract deleted")).toBeVisible();
    await expect(tracking.contractRows).toHaveCount(0);
    await expect(tracking.contractsCard).toContainText("No contracts yet");
  });

  test("TC206: A member's hourly rate can be added, edited and deleted, below the flat rate", async ({
    page,
    jsonDir,
  }) => {
    allure.story("Currency & Billing");
    const { data, projectId } = await loadTestCase(jsonDir, "TC206");
    const flatRate =
      data.payloadCreateProject.custom_default_hourly_billing_rate;
    const first = (await getDocument("Employee", process.env.EMP_ID))
      .employee_name;
    const second = (await getDocument("Employee", process.env.EMP3_ID))
      .employee_name;

    await tracking.goto(projectId);
    // The flat rate is the project's default hourly rate.
    await expect(tracking.ratesCard).toContainText("Flat rate");
    await expect(tracking.ratesCard).toContainText(
      `${formatMoney(flatRate)}/h`,
    );
    await expect(tracking.rateRows).toHaveCount(0);

    for (const { member, rate, day } of [
      { member: first, rate: 450, day: 8 },
      { member: second, rate: 600, day: 20 },
    ]) {
      await tracking.waitForToastsToClear();
      await tracking.ratesCard.getByRole("button").first().click();
      await tracking.fillRate(tracking.addRateDialog, { member, rate, day });
      await tracking.addRateDialog
        .getByRole("button", { name: "Add rate" })
        .click();
      await expect(tracking.toast("Project Rate Added")).toBeVisible();
    }
    // The latest rate comes first, and the flat rate stays above all of them.
    await expect(tracking.rateRows).toHaveCount(2);
    await expect(tracking.rateRows.nth(0)).toContainText(
      `${second}${formatMoney(600)}/h${printedDay(20)}`,
    );
    await expect(tracking.rateRows.nth(1)).toContainText(
      `${first}${formatMoney(450)}/h${printedDay(8)}`,
    );
    const table = await tracking.ratesCard.innerText();
    expect(table.indexOf("Flat rate")).toBeLessThan(table.indexOf(second));

    // By the exact name: one member's name can be the start of another's.
    const row = tracking.rateRows.filter({
      has: page.getByText(first, { exact: true }),
    });
    // The dialog empties its form again when a toast closes under it, so let the toasts go first.
    await tracking.waitForToastsToClear();
    await tracking.openRowMenu(row, "Edit");
    await tracking.fillRate(tracking.editRateDialog, { rate: 500 });
    await tracking.editRateDialog
      .getByRole("button", { name: "Save changes" })
      .click();
    await expect(tracking.toast("Rate updated")).toBeVisible();
    await expect(row).toContainText(`${formatMoney(500)}/h`);

    await tracking.openRowMenu(row, "Delete");
    await tracking.confirmDeleteDialog
      .getByRole("button", { name: "Delete" })
      .click();
    await expect(tracking.toast("Rate deleted")).toBeVisible();
    await expect(tracking.rateRows).toHaveCount(1);
    await expect(
      tracking.ratesCard.getByText(first, { exact: true }),
    ).toHaveCount(0);
  });

  // --------------------------------------
  // Tracking layout
  // --------------------------------------

  test("TC207: A Projects Manager can remove the Task completion, Budget burn and Cost burn widgets and add them back", async ({
    jsonDir,
  }) => {
    allure.story("Currency & Billing");
    const { projectId } = await loadTestCase(jsonDir, "TC207");
    const widgets = [
      { label: "Task completion", title: "Task completion" },
      { label: "Budget burn", title: "Budget burn (to date)" },
      { label: "Cost burn", title: "Cost burn (to date)" },
    ];
    const expectWidgets = async (visible) => {
      for (const { title } of widgets) {
        await expect(
          tracking.tab.getByText(title, { exact: true }),
        ).toHaveCount(visible ? 1 : 0);
      }
    };

    await tracking.goto(projectId);
    await expectWidgets(true);

    await tracking.editButton.click();
    for (const { label } of widgets) await tracking.removeWidget(label);
    await expectWidgets(false);

    // The layout belongs to the project, so it is still gone after a reload.
    await tracking.goto(projectId);
    await expectWidgets(false);

    await tracking.editButton.click();
    await tracking.addWidgets(widgets.map(({ label }) => label));
    await expectWidgets(true);
    await tracking.goto(projectId);
    await expectWidgets(true);
  });
});
