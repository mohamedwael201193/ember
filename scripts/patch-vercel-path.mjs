import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const file = resolve(import.meta.dirname, "../frontend/api/[...path].ts");
let s = readFileSync(file, "utf8");

const old = `const segments = req.query.path;
    const joined = Array.isArray(segments)
      ? segments.join("/")
      : typeof segments === "string"
        ? segments
        : "";
    const pathname = (\`/api/\${joined}\`).replace(/\\/+$/, "") || "/api";`;

const neu = `const rawUrl = typeof req.url === "string" ? req.url : "/api";
    const pathname = new URL(rawUrl, "http://vercel.local").pathname.replace(/\\/+$/, "") || "/api";`;

if (!s.includes("req.query.path")) {
  console.error("pattern not found");
  process.exit(1);
}
s = s.replace(old, neu);
writeFileSync(file, s);
console.log("patched pathname parsing");
