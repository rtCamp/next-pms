#!/usr/bin/env node
// Opens the local app in a visible browser so you sign in yourself. The session is
// saved for measure.mjs, so the password never reaches the scripts, files or Claude.
//
//   node login.mjs
import { parseArgs, loadConfig, launchBrowser, localApp, authStateFile, die } from "./lib.mjs";

const ctx = loadConfig(parseArgs());
const app = localApp(ctx.cfg);
const check = app.login?.check;
if (!check) die("app.login.check isn't set, so login.mjs can't tell when you are signed in.");

const browser = await launchBrowser(ctx, { headless: false });
try {
  const context = await browser.newContext({ viewport: { width: app.viewport.width, height: app.viewport.height } });
  const page = await context.newPage();
  await page.goto(new URL(app.login.page || "/login", app.baseUrl).toString());
  console.log(`Sign in to ${app.baseUrl} in the browser window. Waiting up to 5 minutes…`);

  const checkUrl = new URL(check, app.baseUrl).toString();
  const deadline = Date.now() + 5 * 60 * 1000;
  for (;;) {
    const res = await page.request.get(checkUrl).catch(() => null);
    if (res?.ok()) break;
    if (Date.now() > deadline) die("timed out waiting for the sign-in.");
    await page.waitForTimeout(1000);
  }
  await context.storageState({ path: authStateFile(app) });
  console.log("Signed in. The session is saved for measure.mjs.");
} finally {
  await browser.close();
}
