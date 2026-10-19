import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Pruebas en navegador contra los emuladores de Firebase. Ejecutar con: npm test
const chromium = process.env.CHROMIUM_PATH ?? (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);

export default defineConfig({
  testDir: "tests/web-e2e",
  workers: 1,
  timeout: 60_000,
  reporter: [["list"]],
  use: { locale: "es-AR", timezoneId: "America/Argentina/Buenos_Aires", ...devices["Desktop Chrome"], launchOptions: chromium ? { executablePath: chromium } : {} },
  webServer: [{ command: "node web/serve.mjs 4174 web/dist-emu", url: "http://localhost:4174/", reuseExistingServer: false }],
});
