import { Locator, Page } from "@playwright/test";

export class OrgSelectionPage {
  readonly page: Page;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Select organisation" });
  }

  async goto() {
    await this.page.goto("/orgs");
  }

  orgCard(orgId: string): Locator {
    return this.page.getByTestId(`org-card-${orgId}`);
  }

  async openOrg(orgId: string) {
    await this.orgCard(orgId).click();
  }
}
