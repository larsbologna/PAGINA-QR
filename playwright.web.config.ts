import { defineConfig, devices } from "@playwright/test";

// Pruebas de la web estática: modo demo (puerto 4173) y modo Firebase contra
// los emuladores (puerto 4174). Ejecutar con: npm run test:web
export default defineConfig({
  testDir: "tests/web-e2e",
  workers: 1,
  timeout: 60_000,
  reporter: [["list"]],
  use: { locale: "es-AR", acceptDownloads: true, ...devices["Desktop Chrome"] },
  webServer: [
    { command: "node web/serve.mjs 4173 web/dist", url: "http://localhost:4173/", reuseExistingServer: false },
    { command: "node web/serve.mjs 4174 web/dist-emu", url: "http://localhost:4174/", reuseExistingServer: false },
  ],
});
