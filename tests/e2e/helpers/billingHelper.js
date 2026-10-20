import path from "path";
import {
  cancelDocument,
  createDocument,
  deleteDocument,
  deleteWithLockRetry,
  getDocList,
  getDocument,
  updateDocument,
} from "../utils/api/apiClient";
import { createTimesheet } from "../utils/api/timesheetRequests";
import { getFormattedDate, lastWorkday } from "../utils/dateUtils";
import { readJSONFile } from "../utils/fileUtils";
import { seedTask } from "./taskHelper";

export const USD_CUSTOMER = "QA-USD";

const SALES_ORDER = "Sales Order";
// Preferred first: the one the CI seed creates, then the one staging has.
const PREFERRED_ITEMS = ["E2E Service", "SVC-CONSULT"];

let salesItem;

// What a Sales Order bills. A new Item on staging needs an HSN code, so reuse one that is there.
const getSalesItem = async () => {
  if (salesItem) return salesItem;
  for (const code of PREFERRED_ITEMS) {
    if (await getDocument("Item", code)) {
      salesItem = code;
      return salesItem;
    }
  }
  const [item] = await getDocList("Item", [
    ["item_group", "=", "Services"],
    ["is_stock_item", "=", 0],
    ["disabled", "=", 0],
  ]);
  if (!item) {
    throw new Error(
      `No service Item to put on a Sales Order; create one named "${PREFERRED_ITEMS[0]}".`,
    );
  }
  salesItem = item.name;
  return salesItem;
};

/** Creates the customer the USD projects bill, when the site does not have it. */
export const ensureUsdCustomer = async () => {
  if (await getDocument("Customer", USD_CUSTOMER)) return;
  await createDocument("Customer", {
    customer_name: USD_CUSTOMER,
    customer_type: "Company",
    default_currency: "USD",
  });
};

/**
 * Submits a Sales Order for a project. Submitting it is what fills the
 * project's Total Sales Amount, which the app computes and does not let anyone set.
 */
export const createSalesOrder = async ({
  project,
  customer,
  company,
  amount,
}) => {
  const date = getFormattedDate(new Date());
  return createDocument(SALES_ORDER, {
    customer,
    company,
    project,
    transaction_date: date,
    delivery_date: date,
    items: [
      {
        item_code: await getSalesItem(),
        qty: 1,
        rate: amount,
        delivery_date: date,
      },
    ],
    docstatus: 1,
  });
};

/**
 * Logs time against a new task of the project. A task in a billable project is
 * billable from the start, so a non-billable one is switched off afterwards.
 */
export const seedBillingTime = async (
  projectId,
  { subject, hours, billable = true, employee = process.env.EMP_ID },
) => {
  const task = await seedTask(projectId, subject);
  if (!billable) {
    await updateDocument("Task", task.name, { custom_is_billable: 0 });
  }
  await createTimesheet(
    {
      task: task.name,
      description: `<p>${subject}</p>`,
      hours: String(hours),
      date: lastWorkday(),
      employee,
    },
    "manager",
  );
  return task;
};

/**
 * Seeds what a project's money figures are built from, for the keys a test
 * case's data carries (`<postfix>` pairs a key with `payloadCreateProject<postfix>`):
 *   payloadCreateSalesOrder<postfix>   { amount }
 *   payloadCreateBillingTime<postfix>  [{ subject, hours, billable }]
 */
export const createBillingDataForTestCases = async (testCaseIDs, jsonDir) => {
  if (!Array.isArray(testCaseIDs) || testCaseIDs.length === 0) return;
  const [tcId] = testCaseIDs;
  const entry = (await readJSONFile(path.join(jsonDir, `${tcId}.json`)))[tcId];
  if (!entry) return;

  let seeded = false;
  for (const key of Object.keys(entry)) {
    const postfix = key.match(/^payloadCreateBillingTime(\w*)$/)?.[1];
    if (postfix === undefined) continue;
    const projectId = entry[`payloadDeleteProject${postfix}`]?.projectId;
    if (!projectId) {
      console.warn(`⚠️ [${tcId}] ${key} has no project to book against`);
      continue;
    }
    for (const time of entry[key]) {
      await seedBillingTime(projectId, time);
    }
    seeded = true;
  }

  for (const key of Object.keys(entry)) {
    const postfix = key.match(/^payloadCreateSalesOrder(\w*)$/)?.[1];
    if (postfix === undefined) continue;
    const projectId = entry[`payloadDeleteProject${postfix}`]?.projectId;
    const { customer, company } = entry[`payloadCreateProject${postfix}`] ?? {};
    if (!projectId) {
      console.warn(`⚠️ [${tcId}] ${key} has no project to bill`);
      continue;
    }
    await createSalesOrder({
      project: projectId,
      customer,
      company,
      amount: entry[key].amount,
    });
    seeded = true;
  }
  if (seeded) console.log(`✅ CREATE BILLING DATA SUCCESS FOR: ${testCaseIDs}`);
};

/**
 * Cancels and deletes the Sales Orders of a project; a submitted one blocks the
 * project's delete. Returns what could not be removed.
 */
export const deleteSalesOrdersOfProject = async (projectId) => {
  const failures = [];
  const orders = await getDocList(SALES_ORDER, [["project", "=", projectId]], {
    fields: ["name", "docstatus"],
  });
  for (const { name, docstatus } of orders) {
    if (docstatus === 1) await cancelDocument(SALES_ORDER, name);
    const { deleted } = await deleteWithLockRetry(
      () => deleteDocument(SALES_ORDER, name),
      { label: `${SALES_ORDER} ${name}` },
    );
    if (!deleted) failures.push(`${SALES_ORDER} ${name}`);
  }
  return failures;
};
