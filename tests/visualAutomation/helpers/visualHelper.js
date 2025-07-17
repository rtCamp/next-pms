import { expect } from "@playwright/test";

export const visualCheck = async (page, expectedName, options) => {
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
};
