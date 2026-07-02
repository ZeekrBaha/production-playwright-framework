import { expect, test as setup } from "./workbench/test-hook";
import { USERS } from "./common/fixtures/auth";

/**
 * Logs in through the real UI once per role and saves the resulting
 * storage state. Functional specs start already authenticated.
 */
for (const [role, user] of Object.entries(USERS)) {
  setup(`authenticate as ${role}`, async ({ page, pageFactory }) => {
    const loginPage = pageFactory.login();
    await loginPage.goto();
    await loginPage.login(user.username, user.password);

    await expect(pageFactory.dashboard().heading).toBeVisible();
    await expect(page.getByTestId("role-badge")).toHaveText(role);

    await page.context().storageState({ path: user.storageState });
  });
}
