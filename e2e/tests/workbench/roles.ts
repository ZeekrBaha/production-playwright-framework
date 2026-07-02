import { expect, Page } from "@playwright/test";
import { PageFactory } from "./page-factory";
import type { TestUser } from "../common/config/test-env";

/**
 * Signs the current user out and logs in as another mock user within the
 * SAME browser context, so the app data (localStorage) is shared — the
 * standard pattern for multi-actor workflow specs.
 */
export async function switchUser(
  page: Page,
  pageFactory: PageFactory,
  user: Pick<TestUser, "username" | "password">,
): Promise<void> {
  await page.getByRole("button", { name: "Sign out" }).click();
  await pageFactory.login().login(user.username, user.password);
  await expect(pageFactory.dashboard().heading).toBeVisible();
}
