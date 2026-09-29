#!/usr/bin/env node
/** Reachability probe for the approved dev project. Token is never printed. */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const projectRef = "nwrflbpbhyiqdptmlccm";
const envFile = readFileSync(join(root, ".env.local"), "utf8");
let token = "";
for (const line of envFile.split(/\r?\n/)) {
  const match = line.trim().match(/^(?:export\s+)?SUPABASE_ACCESS_TOKEN\s*=\s*(.*)$/);
  if (match) token = match[1].trim().replace(/^['"]|['"]$/g, "");
}
if (!token) {
  console.error("BLOCKED_NO_CREDENTIAL");
  process.exit(2);
}
const projectRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}`, {
  headers: { Authorization: `Bearer ${token}` },
});
const projectText = await projectRes.text();
let status = "unknown";
try {
  const body = JSON.parse(projectText);
  status = body.status ?? body.database?.status ?? "unknown";
} catch {
  status = "unparsed";
}
console.log(`project_http=${projectRes.status} project_status=${status}`);
if (!projectRes.ok) {
  console.log(projectText.replace(/sbp_[A-Za-z0-9_\-]+/g, "[redacted]").slice(0, 300));
  process.exit(1);
}
const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
const res = await fetch(endpoint, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query: "SELECT 1 AS ok;" }),
});
const text = await res.text();
const safe = text.replace(/sbp_[A-Za-z0-9_\-]+/g, "[redacted]");
console.log(`HTTP ${res.status} ${safe.slice(0, 300)}`);
if (!res.ok) process.exit(1);
