import { Locator, Page } from "@playwright/test";

export class ForecastGridPage {
  readonly page: Page;
  readonly statusBadge: Locator;
  readonly banner: Locator;
  readonly reviewCommentBanner: Locator;
  readonly approvedBanner: Locator;
  readonly unsavedIndicator: Locator;
  readonly addDriversButton: Locator;
  readonly compareButton: Locator;
  readonly calculateButton: Locator;
  readonly saveButton: Locator;
  readonly activityItems: Locator;
  readonly submitButton: Locator;
  readonly reviewCommentInput: Locator;
  readonly approveButton: Locator;
  readonly requestChangesButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.statusBadge = page.getByTestId("status-badge");
    this.banner = page.getByTestId("grid-banner");
    this.reviewCommentBanner = page.getByTestId("review-comment-banner");
    this.approvedBanner = page.getByTestId("approved-banner");
    this.unsavedIndicator = page.getByTestId("unsaved-indicator");
    this.addDriversButton = page.getByRole("button", { name: "Add drivers" });
    this.compareButton = page.getByRole("button", { name: "Compare" });
    this.calculateButton = page.getByRole("button", { name: "Calculate" });
    this.saveButton = page.getByRole("button", { name: "Save", exact: true });
    this.activityItems = page.getByTestId("activity-item");
    this.submitButton = page.getByRole("button", {
      name: "Submit for review",
    });
    this.reviewCommentInput = page.getByLabel("Comment");
    this.approveButton = page.getByRole("button", { name: "Approve" });
    this.requestChangesButton = page.getByRole("button", {
      name: "Request changes",
    });
  }

  async goto(scenarioId: string) {
    await this.page.goto(`/forecasts/${scenarioId}`);
  }

  heading(name: string): Locator {
    return this.page.getByRole("heading", { name, exact: true });
  }

  /** Editable input cell for an input driver. */
  cell(driverKey: string, month: string): Locator {
    return this.page.getByTestId(`cell-${driverKey}-${month}`);
  }

  cellError(driverKey: string, month: string): Locator {
    return this.page.getByTestId(`cell-error-${driverKey}-${month}`);
  }

  /** Read-only rendered value (calculated drivers, or any driver when locked). */
  value(driverKey: string, month: string): Locator {
    return this.page.getByTestId(`value-${driverKey}-${month}`);
  }

  total(driverKey: string): Locator {
    return this.page.getByTestId(`total-${driverKey}`);
  }

  driverRow(driverKey: string): Locator {
    return this.page.getByTestId(`driver-row-${driverKey}`);
  }

  async setCell(driverKey: string, month: string, value: string) {
    await this.cell(driverKey, month).fill(value);
  }

  async calculate() {
    await this.calculateButton.click();
  }

  async save() {
    await this.saveButton.click();
  }

  async submitForReview() {
    await this.submitButton.click();
  }

  async approve() {
    await this.approveButton.click();
  }

  async requestChanges(comment: string) {
    await this.reviewCommentInput.fill(comment);
    await this.requestChangesButton.click();
  }
}
