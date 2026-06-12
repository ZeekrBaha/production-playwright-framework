import { Locator, Page } from "@playwright/test";

export class CreateForecastModal {
  readonly page: Page;
  readonly dialog: Locator;
  readonly nameInput: Locator;
  readonly typeSelect: Locator;
  readonly createButton: Locator;
  readonly cancelButton: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole("dialog", { name: "Create forecast" });
    this.nameInput = this.dialog.getByLabel("Forecast name");
    this.typeSelect = this.dialog.getByLabel("Type");
    this.createButton = this.dialog.getByRole("button", { name: "Create" });
    this.cancelButton = this.dialog.getByRole("button", { name: "Cancel" });
    this.errorAlert = this.dialog.getByRole("alert");
  }

  async create(name: string, type: "Sandbox" | "Budget" = "Sandbox") {
    await this.nameInput.fill(name);
    await this.typeSelect.selectOption({ label: type });
    await this.createButton.click();
  }
}
