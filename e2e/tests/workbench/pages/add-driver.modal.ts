import { Locator, Page } from "@playwright/test";

export class AddDriverModal {
  readonly page: Page;
  readonly dialog: Locator;
  readonly searchInput: Locator;
  readonly applyButton: Locator;
  readonly cancelButton: Locator;
  readonly noResults: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole("dialog", { name: "Add drivers" });
    this.searchInput = this.dialog.getByLabel("Search drivers");
    this.applyButton = this.dialog.getByRole("button", {
      name: "Apply drivers",
    });
    this.cancelButton = this.dialog.getByRole("button", { name: "Cancel" });
    this.noResults = this.dialog.getByTestId("no-driver-results");
  }

  driverCheckbox(label: string): Locator {
    return this.dialog.getByRole("checkbox", { name: label, exact: true });
  }

  async search(text: string) {
    await this.searchInput.fill(text);
  }

  async selectDriver(label: string) {
    await this.driverCheckbox(label).check();
  }

  async apply() {
    await this.applyButton.click();
  }
}
