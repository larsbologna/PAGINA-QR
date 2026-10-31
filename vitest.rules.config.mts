import { defineConfig } from "vitest/config";

// Pruebas de las reglas de Firestore: se corren contra el emulador (npm run test:rules).
export default defineConfig({
  test: {
    include: ["tests/rules.test.ts"],
    testTimeout: 20000,
    fileParallelism: false,
  },
});
