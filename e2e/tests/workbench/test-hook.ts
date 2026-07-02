import { test as base } from "../common/fixtures/test-hook";
import { PageFactory } from "./page-factory";

interface WorkbenchFixtures {
  /** Lazy, memoized entry point to every Workbench page object. */
  pageFactory: PageFactory;
}

/**
 * Application-layer test: the framework fixtures from common/ plus the
 * Workbench PageFactory. Specs import from here so common/ stays free of
 * any knowledge of the SUT.
 */
export const test = base.extend<WorkbenchFixtures>({
  pageFactory: async ({ page }, use) => {
    await use(new PageFactory(page));
  },
});

export { expect } from "@playwright/test";
