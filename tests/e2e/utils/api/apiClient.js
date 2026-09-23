import { request } from "@playwright/test";
import path from "path";
import fs from "fs";
import config from "../../playwright.config";

// Load config variables
export const baseURL = config.use?.baseURL;
// ------------------------------------------------------------------------------------------

/**
 * Ensure the storage-state file for the given role exists, and return its path.
 */
export const loadAuthState = (role) => {
  const filePath = path.resolve(__dirname, `../../auth/${role}-API.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Auth state file for ${role} not found: ${filePath}`);
  }
  return filePath;
};
// ------------------------------------------------------------------------------------------

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Wraps requestContext.fetch() with retry + exponential backoff on transport-level
 * network failures (connection drops, DNS failures, timeouts).
 *
 * Playwright's fetch() only throws for transport-level failures — an HTTP error
 * response (4xx/5xx) resolves normally with response.ok() === false — so this never
 * masks a real application error, it only retries requests that never got a response.
 */
export const fetchWithRetry = async (
  requestContext,
  endpoint,
  fetchOptions,
  { retries = 3, backoffMs = 2000 } = {},
) => {
  let attempt = 0;
  for (;;) {
    try {
      return await requestContext.fetch(endpoint, fetchOptions);
    } catch (err) {
      attempt += 1;
      if (attempt > retries) {
        throw err;
      }
      const delay = backoffMs * 2 ** (attempt - 1);
      console.warn(
        `⚠️ Network error on ${fetchOptions?.method || "GET"} ${endpoint} (attempt ${attempt}/${retries}): ${err.message}. Retrying in ${delay}ms…`,
      );
      await sleep(delay);
    }
  }
};

// ------------------------------------------------------------------------------------------

/**
 * True when a failed request is a Frappe row-lock failure rather than a real
 * rejection.
 *
 * `frappe.model.delete_doc` opens with
 * `frappe.db.get_value(doctype, name, for_update=True, wait=False)` - a
 * SELECT ... FOR UPDATE **NOWAIT**. Any transaction still holding the row makes
 * the delete fail instantly instead of queueing, and Frappe surfaces it as a
 * 500 carrying QueryTimeoutError / "Lock wait timeout exceeded".
 *
 * Teardown runs the moment the tests stop, while the app's own post-write hooks
 * (project totals recalculated from task changes) are still committing, so this
 * is exactly when the locks are held. It clears in seconds - which is why the
 * *next* run's setup sweep deletes what teardown could not.
 */
export const isRowLockError = (err) =>
  /QueryTimeoutError|Lock wait timeout exceeded|being modified by another user/i.test(
    String(err?.message ?? ""),
  );

/**
 * Runs a delete, retrying while the row is locked.
 *
 * Deletes are idempotent here - a 404 on a retry means an earlier attempt
 * landed - so retrying is safe. Anything that is not a lock failure is rethrown
 * immediately rather than retried.
 */
export const deleteWithLockRetry = async (
  deleteFn,
  { label = "document", retries = 4, backoffMs = 2000 } = {},
) => {
  let attempt = 0;
  for (;;) {
    try {
      return await deleteFn();
    } catch (err) {
      if (!isRowLockError(err)) throw err;

      attempt += 1;
      if (attempt > retries) {
        throw new Error(
          `${label}: still locked after ${retries} retries. Last error: ${err.message}`,
        );
      }
      const delay = backoffMs * 2 ** (attempt - 1);
      console.warn(
        `🔒 ${label} locked (attempt ${attempt}/${retries}). Retrying in ${delay}ms…`,
      );
      await sleep(delay);
    }
  }
};

// ------------------------------------------------------------------------------------------

/**
 * Deletes a document, returning { deleted, reason } rather than throwing, so
 * teardown can clear dependants and report what survived.
 *
 * Do NOT fetch a CSRF token here. The `<role>-API.json` states carry no
 * csrf_token, which is why Frappe skips CSRF for them; hitting `/app` mints one
 * onto the session and every later CSRF-less write on it fails.
 */
export const deleteDocument = async (doctype, name, role = "admin") => {
  if (!name) return { deleted: false, reason: "no name given" };

  const endpoint = `/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`;
  const requestContext = await request.newContext({
    baseURL,
    storageState: loadAuthState(role),
  });
  try {
    const res = await fetchWithRetry(requestContext, endpoint, {
      method: "DELETE",
      timeout: 120000,
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok()) return { deleted: true };

    const body = await res.text();
    // Already gone is the outcome the caller wanted. Reporting it as a failure
    // fills teardown's log with warnings for records that are legitimately absent
    // - which is how a real failure gets lost in the noise.
    if (res.status() === 404 || /DoesNotExistError/.test(body))
      return { deleted: true, alreadyGone: true };
    // A row lock is transient - throw so deleteWithLockRetry retries it.
    if (isRowLockError({ message: body })) {
      throw new Error(
        `Lock wait timeout exceeded deleting ${doctype} ${name}: ${res.status()}`,
      );
    }
    const reason =
      body.match(/frappe\.exceptions\.(\w+)/)?.[1] ??
      body.match(/"exc_type":\s*"(\w+)"/)?.[1] ??
      `HTTP ${res.status()}`;
    // Warn here rather than leaving it to each caller: this resolves instead of
    // throwing, and the try/catch the callers already had no longer sees a
    // refusal, so a silent `deleted: false` would read as a clean teardown.
    console.warn(`⚠️ Could not delete ${doctype} ${name}: ${reason}`);
    return { deleted: false, reason };
  } finally {
    await requestContext.dispose();
  }
};

// ------------------------------------------------------------------------------------------

/**
 * Lists documents via frappe.client.get_list.
 *
 * A GET, unlike filterApi()'s reportview POST, and it returns plain objects
 * rather than positional value arrays - so callers read `row.name` instead of
 * guessing which column they flattened.
 */
export const getDocList = async (
  doctype,
  filters = [],
  { fields = ["name"], limit = 500, role = "admin", orderBy } = {},
) => {
  const qs = new URLSearchParams({
    doctype,
    fields: JSON.stringify(fields),
    filters: JSON.stringify(filters),
    limit_page_length: String(limit),
    ...(orderBy ? { order_by: orderBy } : {}),
  });

  const requestContext = await request.newContext({
    baseURL,
    storageState: loadAuthState(role),
  });
  try {
    const res = await fetchWithRetry(
      requestContext,
      `/api/method/frappe.client.get_list?${qs}`,
      { method: "GET" },
    );
    if (!res.ok()) {
      console.warn(
        `⚠️ Could not list ${doctype}: ${res.status()} ${res.statusText()}`,
      );
      return [];
    }
    return (await res.json())?.message ?? [];
  } finally {
    await requestContext.dispose();
  }
};

// ------------------------------------------------------------------------------------------

/**
 * Cancels a submitted document, so it can then be deleted.
 *
 * Frappe refuses to delete a document at docstatus 1; teardown hits this on
 * every timesheet a test submitted.
 */
export const cancelDocument = async (doctype, name, role = "admin") => {
  const requestContext = await request.newContext({
    baseURL,
    storageState: loadAuthState(role),
  });
  try {
    // `data`, not `postData`: Playwright's APIRequestContext.fetch ignores
    // postData without complaint and sends an empty body.
    const res = await fetchWithRetry(
      requestContext,
      "/api/method/frappe.client.cancel",
      {
        method: "POST",
        timeout: 120000,
        headers: { "Content-Type": "application/json" },
        data: { doctype, name },
      },
    );
    if (!res.ok()) {
      console.warn(
        `⚠️ Could not cancel ${doctype} ${name}: ${res.status()} ${res.statusText()}`,
      );
    }
    return { cancelled: res.ok() };
  } finally {
    await requestContext.dispose();
  }
};

// ------------------------------------------------------------------------------------------

/**
 * Creates a document and returns the created doc (including its `creation`).
 */
export const createDocument = async (doctype, data, role = "admin") => {
  const requestContext = await request.newContext({
    baseURL,
    storageState: loadAuthState(role),
  });
  try {
    const res = await fetchWithRetry(
      requestContext,
      `/api/resource/${encodeURIComponent(doctype)}`,
      {
        method: "POST",
        timeout: 120000,
        headers: { "Content-Type": "application/json" },
        data,
      },
    );
    if (!res.ok()) {
      throw new Error(
        `Could not create ${doctype}: ${res.status()} ${res.statusText()}`,
      );
    }
    return (await res.json())?.data;
  } finally {
    await requestContext.dispose();
  }
};
