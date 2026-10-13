import { defineConfig } from "vitest/config";

// Pruebas de la versión web estática (GitHub Pages + Firebase). Se ejecutan con
// el emulador de Firestore: `npm run test:web:rules`.
export default defineConfig({
  test: {
    include: ["tests/web/**/*.test.ts"],
    environment: "node",
    fileParallelism: false,
    testTimeout: 30000,
  },
});
