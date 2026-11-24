/**
 * Prisma cannot switch datasource provider via env, so production uses a
 * Postgres variant of the same schema generated from the SQLite one.
 *
 *   npm run db:pg:sync
 *
 * This keeps a single source of truth (prisma/schema.prisma) and makes the
 * provider swap mechanical instead of a copy that drifts.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

const src = resolve(root, "prisma/schema.prisma");
const out = resolve(root, "prisma/schema.postgres.prisma");

const content = readFileSync(src, "utf8");

if (!content.includes('provider = "sqlite"')) {
  console.error("Expected `provider = \"sqlite\"` in prisma/schema.prisma — aborting.");
  process.exit(1);
}

const postgres = content
  .replace('provider = "sqlite"', 'provider = "postgresql"')
  .replace(
    "// SQLite for local dev.",
    "// GENERATED FILE — do not edit. Run `npm run db:pg:sync`.\n// Postgres variant of prisma/schema.prisma for production imports decimal-free types as-is.",
  );

writeFileSync(out, postgres, "utf8");
console.log(`Wrote ${out}`);
