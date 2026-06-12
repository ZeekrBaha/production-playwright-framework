import { expect, test } from "../../common/fixtures/test-hook";
import { NO_AUTH, USERS } from "../../common/fixtures/auth";

test.describe("Login", { tag: "@regression" }, () => {
  // These specs exercise the login flow itself, so start unauthenticated.
  test.use({ storageState: NO_AUTH });

  test(
    "valid credentials land on the dashboard",
    { tag: "@smoke" },
    async ({ page, pageFactory }) => {
      const loginPage = pageFactory.login();
      await loginPage.goto();
      await loginPage.login(USERS.inputter.username, USERS.inputter.password);

      await expect(pageFactory.dashboard().heading).toBeVisible();
      await expect(page.getByTestId("user-chip")).toContainText(USERS.inputter.displayName);
      await expect(page.getByTestId("role-badge")).toHaveText("inputter");
    },
  );

  test("invalid credentials show an error and stay on login", async ({ pageFactory }) => {
    const loginPage = pageFactory.login();
    await loginPage.goto();
    await loginPage.login("ines", "wrong-password");

    await expect(loginPage.errorAlert).toHaveText("Invalid username or password");
    await expect(loginPage.signInButton).toBeVisible();
  });

  test("unauthenticated visit to a protected page redirects to login", async ({
    page,
    pageFactory,
  }) => {
    await page.goto("/orgs");
    await expect(pageFactory.login().signInButton).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("sign out returns to the login page", async ({ page, pageFactory }) => {
    const loginPage = pageFactory.login();
    await loginPage.goto();
    await loginPage.login(USERS.reviewer.username, USERS.reviewer.password);
    await expect(pageFactory.dashboard().heading).toBeVisible();

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(loginPage.signInButton).toBeVisible();
  });
});
