#!/usr/bin/env node
/**
 * Find and delete records on staging — for cleaning up after a probe that
 * created data, or clearing leftovers that block a re-run (a duplicate project,
 * an overlapping allocation).
 *
 * Frappe rejects a plain `DELETE /api/resource/<doctype>/<name>` with
 * CSRFTokenError even with a valid session cookie, so this pulls a CSRF token
 * out of the desk boot payload first and posts to frappe.client.delete.
 *
 * Usage, from the repo root — always list before deleting:
 *
 *   node .claude/skills/next-pms-e2e/scripts/cleanup.mjs list \
 *     --doctype "Resource Allocation" \
 *     --filters '[["project","=","PROJ-7544"],["allocation_start_date","=","2026-09-07"]]'
 *
 *   node .claude/skills/next-pms-e2e/scripts/cleanup.mjs delete \
 *     --doctype "Resource Allocation" --name RA-EMP-00911-2026-0076
 *
 * Deletion is irreversible and this points at shared staging, so `delete`
 * refuses without an explicit --name (no bulk delete by filter on purpose) and
 * verifies the record is gone afterwards. Link constraints mean order matters:
 * time entry -> task -> project, or Frappe raises LinkExistsError.
 */

import fs from "fs";
import path from "path";

const argv = process.argv.slice(2);
const cmd = argv.find((a) => !a.startsWith("--"));
const flag = (name, fallback = null) => {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const next = argv[i + 1];
  return !next || next.startsWith("--") ? true : next;
};

if (!["list", "delete"].includes(cmd)) {
  console.error("usage: cleanup.mjs <list|delete> --doctype <Doctype> [--filters JSON] [--name NAME] [--role manager]");
  process.exit(1);
}

const repoRoot = process.cwd();
const role = flag("role", "manager");
const doctype = flag("doctype");
if (!doctype) {
  console.error("--doctype is required");
  process.exit(1);
}

const pwPath = path.join(repoRoot, "node_modules", "playwright", "index.mjs");
if (!fs.existsSync(pwPath)) {
  console.error(`Playwright not found at ${pwPath}. Run from the repo root.`);
  process.exit(1);
}
const { request } = await import(pwPath);

const authDir = path.join(repoRoot, "tests", "e2e", "auth");
const stateFile =
  [`${role}-API.json`, ...fs.readdirSync(authDir).filter((f) => f.startsWith(`${role}-w`))].find((f) =>
    fs.existsSync(path.join(authDir, f))
  ) || null;
if (!stateFile) {
  console.error(`No auth state for role "${role}" in ${authDir}`);
  process.exit(1);
}

const envPath = path.join(repoRoot, "tests", "e2e", ".env");
let baseURL = process.env.BASE_URL;
if (!baseURL && fs.existsSync(envPath)) {
  baseURL = fs.readFileSync(envPath, "utf8").match(/^BASE_URL=(.+)$/m)?.[1]?.trim();
}
baseURL = (baseURL || "").replace(/\/$/, "");
if (!baseURL) {
  console.error("BASE_URL not set and not found in tests/e2e/.env");
  process.exit(1);
}

const state = JSON.parse(fs.readFileSync(path.join(authDir, stateFile), "utf8"));
const cookie = state.cookies.map((c) => `${c.name}=${c.value}`).join("; ");
const ctx = await request.newContext({ baseURL, extraHTTPHeaders: { Cookie: cookie } });

const getList = async (filters, fields) => {
  const qs = new URLSearchParams({
    doctype,
    fields: JSON.stringify(fields),
    filters: filters || "[]",
    limit_page_length: "50",
  });
  const res = await ctx.get(`/api/method/frappe.client.get_list?${qs}`);
  const body = await res.json().catch(() => ({}));
  return { status: res.status(), rows: body.message || [] };
};

try {
  if (cmd === "list") {
    const fields = JSON.parse(flag("fields", '["name","owner","creation"]'));
    const { status, rows } = await getList(flag("filters"), fields);
    console.log(`status=${status}  matched=${rows.length}`);
    for (const r of rows) console.log(" ", JSON.stringify(r));
    if (!rows.length) console.log("(nothing matched — check the filters)");
  } else {
    const name = flag("name");
    if (!name || name === true) {
      console.error("--name is required for delete (no bulk delete by filter, by design)");
      process.exit(1);
    }

    // Show what is about to go, so the operator can see it in the log.
    const before = await getList(JSON.stringify([["name", "=", name]]), ["name", "owner", "creation"]);
    if (!before.rows.length) {
      console.log(`${doctype} ${name} does not exist — nothing to do.`);
      process.exit(0);
    }
    console.log(`deleting ${doctype} ${name}: ${JSON.stringify(before.rows[0])}`);

    const html = await (await ctx.get("/app")).text();
    const token = html.match(/csrf_token["']?\s*[:=]\s*["']([a-f0-9]{16,})["']/i)?.[1];
    if (!token) {
      console.error("could not extract a CSRF token from /app — is the session still valid?");
      process.exit(1);
    }

    const res = await ctx.post("/api/method/frappe.client.delete", {
      headers: { "Content-Type": "application/json", "X-Frappe-CSRF-Token": token },
      data: { doctype, name },
    });
    const text = await res.text();
    console.log(`delete status=${res.status()} ${text.slice(0, 200)}`);

    const after = await getList(JSON.stringify([["name", "=", name]]), ["name"]);
    if (after.rows.length === 0) {
      console.log("verified: record is gone");
    } else {
      console.error("STILL PRESENT — delete did not take effect");
      if (/LinkExistsError/i.test(text)) {
        console.error("linked documents exist; delete children first (time entry -> task -> project)");
      }
      process.exitCode = 1;
    }
  }
} finally {
  await ctx.dispose();
}
