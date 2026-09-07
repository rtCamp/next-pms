/**
 * External dependencies.
 */
import type { ComponentType } from "react";

/**
 * Internal dependencies.
 */
import { BudgetBurnCell } from "./components/budgetBurn";
import { ContractsTable } from "./components/contractsTable";
import { CostBurnCell } from "./components/costBurn";
import { FinancialsColumn } from "./components/financialsColumn";
import { HoursUsageCell } from "./components/hoursUsage";
import { InvoiceBurnCell } from "./components/invoiceBurn";
import { LifetimeExpectedCell } from "./components/lifetimeExpected";
import { LifetimeToDateCell } from "./components/lifetimeToDate";
import { LifetimeVsBilledCell } from "./components/lifetimeVsBilled";
import { ProjectRatesTable } from "./components/projectRatesTable";
import { TaskCompletionCell } from "./components/taskCompletion";

import type { WidgetKey, WidgetLayout } from "./types";

/**
 * Widgets read their own slice from context, so the grid passes nothing but the
 * layout its row implies. Components that do not vary by width simply omit it.
 */
type WidgetComponent = ComponentType<{ layout: WidgetLayout }>;

export const WIDGETS: Record<WidgetKey, WidgetComponent> = {
  financials: FinancialsColumn,
  task_completion: TaskCompletionCell,
  hours_usage: HoursUsageCell,
  invoice_burn: InvoiceBurnCell,
  budget_burn: BudgetBurnCell,
  cost_burn: CostBurnCell,
  lifetime_to_date: LifetimeToDateCell,
  lifetime_expected: LifetimeExpectedCell,
  lifetime_vs_billed: LifetimeVsBilledCell,
  contracts: ContractsTable,
  rates: ProjectRatesTable,
};
