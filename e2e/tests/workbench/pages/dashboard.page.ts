import { Locator, Page } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly emptyState: Locator;
  readonly queueItems: Locator;
  readonly queueEmpty: Locator;
  readonly activityItems: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Dashboard" });
    this.emptyState = page.getByTestId("dashboard-empty");
    this.queueItems = page.getByTestId("queue-item");
    this.queueEmpty = page.getByTestId("queue-empty");
    this.activityItems = page.getByTestId("activity-item");
  }

  async goto() {
    await this.page.goto("/dashboard");
  }

  /** The big number on a stat card, e.g. cardValue("card-gmv"). */
  cardValue(testId: string): Locator {
    return this.page.getByTestId(`${testId}-value`);
  }

  queueHeading(name: "My queue" | "Review queue"): Locator {
    return this.page.getByRole("heading", { name });
  }
}
