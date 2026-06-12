import type { Page, Request } from "@playwright/test";

/**
 * Network-interception helpers for the SUT's mock API.
 *
 * The app performs real HTTP round trips for every mutation
 * (POST/PATCH/DELETE under /api/) and applies changes only after the
 * server accepts them, so these helpers can simulate failures, conflicts,
 * and latency — and capture request payloads for contract assertions.
 */
export const API_ROUTES = {
  forecasts: "**/api/forecasts",
  forecastById: "**/api/forecasts/*",
  action: (action: "calculate" | "submit" | "approve" | "request-changes") =>
    `**/api/forecasts/*/${action}`,
} as const;

/** Makes every matching request fail with the given status and error body. */
export async function failApi(
  page: Page,
  urlPattern: string,
  status: number,
  message: string,
): Promise<void> {
  await page.route(urlPattern, (route) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify({ error: message }),
    }),
  );
}

/** Delays matching requests by `ms` before letting them through. */
export async function delayApi(
  page: Page,
  urlPattern: string,
  ms: number,
): Promise<void> {
  await page.route(urlPattern, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, ms));
    await route.continue();
  });
}

/**
 * Records matching requests (and lets them through) so specs can assert
 * on method, URL, and JSON payload.
 */
export async function captureApi(
  page: Page,
  urlPattern: string,
): Promise<Request[]> {
  const captured: Request[] = [];
  await page.route(urlPattern, async (route) => {
    captured.push(route.request());
    await route.continue();
  });
  return captured;
}

/** Stops intercepting the given pattern (restores real behavior). */
export async function resetApi(page: Page, urlPattern: string): Promise<void> {
  await page.unroute(urlPattern);
}
