import { Locator, Page } from "@playwright/test";

export class ForecastListPage {
  readonly page: Page;
  readonly createForecastButton: Locator;
  readonly rows: Locator;
  readonly emptyState: Locator;
  readonly noResults: Locator;
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly typeFilter: Locator;
  readonly sortSelect: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createForecastButton = page.getByRole("button", {
      name: "Create forecast",
    });
    this.rows = page.getByTestId("scenario-row");
    this.emptyState = page.getByTestId("empty-state");
    this.noResults = page.getByTestId("no-results");
    this.searchInput = page.getByLabel("Search forecasts");
    this.statusFilter = page.getByLabel("Status");
    this.typeFilter = page.getByLabel("Type");
    this.sortSelect = page.getByLabel("Sort by");
  }

  /** Forecast names in current display order. */
  async visibleNames(): Promise<string[]> {
    return this.rows.getByRole("link").allTextContents();
  }

  async copyForecast(name: string) {
    await this.rowByName(name).getByRole("button", { name: "Copy" }).click();
  }

  async goto(orgId: string) {
    await this.page.goto(`/orgs/${orgId}`);
  }

  heading(orgName: string): Locator {
    return this.page.getByRole("heading", { name: `${orgName} forecasts` });
  }

  rowByName(name: string): Locator {
    return this.rows.filter({
      has: this.page.getByRole("link", { name, exact: true }),
    });
  }

  statusBadgeFor(name: string): Locator {
    return this.rowByName(name).getByTestId("status-badge");
  }

  async openForecast(name: string) {
    await this.page.getByRole("link", { name, exact: true }).click();
  }

  async deleteForecast(name: string) {
    this.page.once("dialog", (dialog) => dialog.accept());
    await this.rowByName(name)
      .getByRole("button", { name: "Delete" })
      .click();
  }
}
