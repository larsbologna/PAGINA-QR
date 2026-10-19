// Arma la web estática en web/dist (lo que se publica en GitHub Pages).
//   node web/build.mjs
import { build } from "esbuild";
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = process.env.OUT_DIR ? join(here, "..", process.env.OUT_DIR) : join(here, "dist");
const fonts = join(here, "..", "node_modules", "@fontsource-variable");
rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, "fonts"), { recursive: true });

await build({
  entryPoints: [join(here, "src", "main.js")],
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["es2020", "safari14"],
  minify: true,
  outfile: join(out, "app.js"),
  legalComments: "none",
  logLevel: "warning",
});

for (const f of ["index.html", "styles.css", "firebase-config.js", "favicon.svg"]) cpSync(join(here, f), join(out, f));
// Tipografías servidas desde el propio sitio (licencia OFL).
cpSync(join(fonts, "geist", "files", "geist-latin-wght-normal.woff2"), join(out, "fonts", "geist.woff2"));
cpSync(join(fonts, "bricolage-grotesque", "files", "bricolage-grotesque-latin-wght-normal.woff2"), join(out, "fonts", "bricolage.woff2"));
// Para pruebas locales con el emulador de Firebase (no se usa en GitHub Pages).
if (process.env.WEB_CONFIG && existsSync(process.env.WEB_CONFIG)) cpSync(process.env.WEB_CONFIG, join(out, "firebase-config.js"));
writeFileSync(join(out, ".nojekyll"), "");
console.log(`✔ Web lista en ${out}`);
