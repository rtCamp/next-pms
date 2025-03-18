/**
 * LoginPage class handles interactions with the login page.
 */
export class LoginPage {
  /**
   * Initializes the LoginPage object.
   * @param {import('@playwright/test').Page} page - Playwright page instance.
   */
  constructor(page) {
    this.page = page;

    // Login form elements
    this.emailInput = page.getByRole("textbox", { name: "Email" });
    this.passwordInput = page.getByRole("textbox", { name: "Password" });
    this.loginButton = page.getByRole("button", { name: "Login" });
  }

  // --------------------------------------
  // General
  // --------------------------------------

  /**
   * Navigates to the login page and waits for it to fully load.
   */
  async goto() {
    await this.page.goto("/login", { waitUntil: "domcontentloaded" });
  }

  // --------------------------------------
  // Login Form Actions
  // --------------------------------------

  /**
   * Performs login with the provided credentials.
   */
  async login(email, password) {
    await this.emailInput.fill(email.trim());
    await this.passwordInput.fill(password.trim());
    await this.loginButton.click();
  }
}
