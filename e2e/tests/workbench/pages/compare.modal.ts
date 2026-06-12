import { Locator, Page } from "@playwright/test";

export class CompareModal {
  readonly page: Page;
  readonly dialog: Locator;
  readonly targetSelect: Locator;
  readonly compareButton: Locator;
  readonly closeButton: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole("dialog", { name: "Compare forecasts" });
    this.targetSelect = this.dialog.getByLabel("Compare with");
    this.compareButton = this.dialog.getByRole("button", { name: "Compare" });
    this.closeButton = this.dialog.getByRole("button", { name: "Close" });
    this.errorAlert = this.dialog.getByRole("alert");
  }

  thisTotal(driverKey: string): Locator {
    return this.page.getByTestId(`compare-this-${driverKey}`);
  }

  otherTotal(driverKey: string): Locator {
    return this.page.getByTestId(`compare-other-${driverKey}`);
  }

  delta(driverKey: string): Locator {
    return this.page.getByTestId(`compare-delta-${driverKey}`);
  }

  async compareWith(scenarioName: string) {
    await this.targetSelect.selectOption({ label: scenarioName });
    await this.compareButton.click();
  }
}
