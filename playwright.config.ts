import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
export const E2E_DB =
  process.env.E2E_DATABASE_URL ?? "postgresql://reputacion:reputacion@localhost:5432/reputacion_e2e?schema=public";

const serverEnv = {
  DATABASE_URL: E2E_DB,
  APP_URL: `http://localhost:${PORT}`,
  APP_SECRET: "secreto-e2e-0123456789abcdef",
  RATE_LIMIT_FEEDBACK_PER_HOUR: "100",
  RATE_LIMIT_LOGIN_PER_15MIN: "200",
  TRUST_PROXY: "false",
};

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: [["list"]],
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    locale: "es-AR",
    timezoneId: "America/Argentina/Buenos_Aires",
    acceptDownloads: true,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: process.env.E2E_SKIP_BUILD ? `npx next start -p ${PORT}` : `npx next build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    timeout: 240_000,
    reuseExistingServer: false,
    env: serverEnv,
  },
});
