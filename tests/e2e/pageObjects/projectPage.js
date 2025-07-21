export class ProjectPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;

    //Search bar on project page
    this.searchBar = page.getByRole("textbox", { name: "Project Name" });
    //List of projects displayed in the table
    this.projectListItems = page.locator("//table//tbody//tr//td[1]//p");
  }

  /**
   * Navigates to the project page and waits for it to fully load.
   */
  async goto() {
    await this.page.goto("/next-pms/project", { waitUntil: "domcontentloaded" });
  }

  /**
   * Perform a search using the search bar.
   * @param {string} query - The search query.
   */
  async searchProject(query) {
    await this.searchBar.fill(query);
    await this.searchBar.press("Enter"); // Simulate pressing Enter to trigger the search
    await this.page.waitForLoadState("networkidle"); // Wait for the search results to load
  }

  /**
   * Get the list of project names currently displayed.
   */
  async getProjectList() {
    const projectNames = await this.projectListItems.allTextContents();
    const totalCount = projectNames.length;
    return { projectNames, totalCount };
  }
}
