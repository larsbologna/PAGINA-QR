// Servidor estático mínimo para probar web/dist localmente: node web/serve.mjs [puerto]
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const port = Number(process.argv[2] ?? process.env.PORT ?? 4173);
const root = process.argv[3] ?? join(fileURLToPath(new URL(".", import.meta.url)), "dist");
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml" };

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const rel = normalize(path === "/" ? "/index.html" : path).replace(/^([/\\])+/, "");
  if (rel.startsWith("..")) return res.writeHead(400).end();
  try {
    const body = await readFile(join(root, rel));
    res.writeHead(200, { "Content-Type": types[extname(rel)] ?? "application/octet-stream" }).end(body);
  } catch {
    res.writeHead(404).end("No encontrado");
  }
}).listen(port, () => console.log(`Web estática en http://localhost:${port}`));
