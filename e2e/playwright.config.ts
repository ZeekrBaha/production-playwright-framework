import { defineConfig, devices } from "@playwright/test";
import { testEnv } from "./tests/common/config/test-env";

/**
 * Forecast Workbench e2e configuration.
 *
 * Projects:
 *   setup          — logs in via the UI once per role and saves storageState
 *   desktop-chrome — functional specs on desktop viewport (everything except @mobile)
 *   mobile-chrome  — responsive smoke specs tagged @mobile on a Pixel 7 profile
 *
 * Specs run authenticated as the inputter by default; role-specific suites
 * load the reviewer state explicitly. The Vite dev server (with its stateless
 * mock API) is started automatically via `webServer`.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: testEnv.isCI,
  retries: testEnv.isCI ? 2 : 0,
  reporter: testEnv.isCI
    ? [["list"], ["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  timeout: 30_000,
  snapshotPathTemplate: "{testFileDir}/{testFileName}-snapshots/{arg}{ext}",
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL: testEnv.baseUrl,
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev --prefix ../apps/workbench",
    url: testEnv.baseUrl,
    reuseExistingServer: !testEnv.isCI,
    timeout: 60_000,
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "desktop-chrome",
      testMatch: /.*\.spec\.ts/,
      grepInvert: /@mobile/,
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: testEnv.users.inputter.storageState,
      },
    },
    {
      name: "mobile-chrome",
      testMatch: /.*\.spec\.ts/,
      grep: /@mobile/,
      dependencies: ["setup"],
      use: {
        ...devices["Pixel 7"],
        storageState: testEnv.users.inputter.storageState,
      },
    },
  ],
});
