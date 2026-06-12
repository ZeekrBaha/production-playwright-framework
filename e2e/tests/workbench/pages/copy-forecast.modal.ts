import { Locator, Page } from "@playwright/test";

export class CopyForecastModal {
  readonly page: Page;
  readonly dialog: Locator;
  readonly nameInput: Locator;
  readonly copyButton: Locator;
  readonly cancelButton: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole("dialog", { name: "Copy forecast" });
    this.nameInput = this.dialog.getByLabel("New forecast name");
    this.copyButton = this.dialog.getByRole("button", { name: "Copy" });
    this.cancelButton = this.dialog.getByRole("button", { name: "Cancel" });
    this.errorAlert = this.dialog.getByRole("alert");
  }

  async copyAs(name: string) {
    await this.nameInput.fill(name);
    await this.copyButton.click();
  }
}
