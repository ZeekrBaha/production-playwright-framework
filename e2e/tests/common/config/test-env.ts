/**
 * Single source of truth for environment-dependent test configuration.
 * Everything the framework needs to know about WHERE and HOW it runs
 * lives here — specs and the Playwright config both consume it.
 */
export interface TestUser {
  username: string;
  displayName: string;
  password: string;
  storageState: string;
}

export interface TestEnv {
  baseUrl: string;
  isCI: boolean;
  /** The SUT runs against a stateless mock API (see apps/workbench/vite.config.ts). */
  mockApi: boolean;
  users: {
    inputter: TestUser;
    reviewer: TestUser;
  };
}

export const testEnv: TestEnv = {
  baseUrl: process.env.BASE_URL ?? "http://localhost:5173",
  isCI: Boolean(process.env.CI),
  mockApi: true,
  users: {
    inputter: {
      username: "ines",
      displayName: "Ines Alvarez",
      password: "demo123",
      storageState: ".auth/inputter.json",
    },
    reviewer: {
      username: "ravi",
      displayName: "Ravi Patel",
      password: "demo123",
      storageState: ".auth/reviewer.json",
    },
  },
};

/** Empty storage state for specs that must start unauthenticated. */
export const NO_AUTH = { cookies: [], origins: [] };
