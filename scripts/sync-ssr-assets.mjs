#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const src = join("node_modules", ".nitro", "vite", "services", "ssr", "assets");
const dest = join(".output", "public", "assets");

if (!existsSync(src)) process.exit(0);
mkdirSync(dest, { recursive: true });

for (const name of readdirSync(src)) {
  if (!name.endsWith(".css") && !name.endsWith(".js")) continue;
  cpSync(join(src, name), join(dest, name));
}
