/**
 * Navigates to a URL, retrying once when the server answers with an error.
 *
 * The app intermittently 500s on a cold route under parallel load; a reload
 * clears it. Without this the page renders "Server Error", no chrome loads, and
 * the test reports an opaque timeout instead of the real cause.
 */
export const gotoWithRetry = async (page, url, { retries = 2 } = {}) => {
  let response;

  for (let attempt = 1; attempt <= retries; attempt++) {
    response = await page.goto(url, { waitUntil: "domcontentloaded" });
    if (!response || response.ok()) return response;

    if (attempt < retries) await page.waitForTimeout(2000);
  }

  throw new Error(
    `${url} returned ${response.status()} on ${retries} attempts - server error, not a test failure.`,
  );
};
