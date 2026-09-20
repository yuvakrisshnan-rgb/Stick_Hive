#!/usr/bin/env node
// Seeds the D1 `products` table from stickers.csv. Local D1 only - this
// script never takes a --remote option; there is no way to point it at
// the remote database short of hand-editing the wrangler invocation, and
// that's deliberate.
//
// Usage:
//   node scripts/seed-products.mjs validate [--csv <path>] [--source <dir>]
//   node scripts/seed-products.mjs seed [--dry-run] [--csv <path>] [--source <dir>] [--db <name>] [--batch-size N]
//
// validate: pre-flight checks only, no D1 access, exit 0/1.
// seed: runs validate first (aborts on any blocking failure), then
//   upserts by slug into local D1, reporting Inserted/Updated/Skipped/Failed.

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";

import {
  parseCsv,
  loadExisting,
  walk,
  sha256File,
  EXCLUDED_SOURCE_PATHS,
  IMAGE_EXTENSIONS,
  CONVERTIBLE_EXTENSIONS,
  DEFAULT_SOURCE,
  DEFAULT_CSV,
} from "./sticker-intake.mjs";

// Every wrangler invocation below runs with this as `cwd`, never the
// caller's ambient shell cwd - this project has already hit the exact
// failure mode of `wrangler d1` calls silently resolving to a *different*
// local D1 SQLite file depending on which directory they were run from
// (root wrangler.jsonc vs dist/server/wrangler.json after a vinext
// build). Pinning cwd to the repo root (this file's parent directory)
// keeps every call - manual or scripted - hitting the same local D1.
const repoRoot = path.resolve(import.meta.dirname, "..");

function getArg(args, name, def) {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return def;
  return args[idx + 1];
}

function hasFlag(args, name) {
  return args.includes(`--${name}`);
}

// dbName reaches a shell:true child_process call (see runWranglerD1File) -
// it's the one value in that command line that isn't either a fixed
// string or a path this script generated itself (os.tmpdir()-based), so
// it's validated here rather than trusted as-is. D1 database names are
// simple identifiers in practice (stickhive-db); reject anything else
// outright instead of letting it reach a shell command line.
function assertSafeDbName(dbName) {
  if (!/^[a-zA-Z0-9_-]+$/.test(dbName)) {
    throw new Error(`Refusing unsafe --db value: ${JSON.stringify(dbName)} (expected letters, digits, - or _ only)`);
  }
  return dbName;
}

// ---------------------------------------------------------------------------
// D1 access (shells out to wrangler - a plain Node script can't reach the
// D1Database binding directly, that only exists inside the Workers/vinext
// runtime; see backend/db/d1.ts's getD1())
// ---------------------------------------------------------------------------

// The local wrangler binary, invoked directly rather than via `npx`
// (execFileSync("npx", ...) fails with ENOENT on Windows - npx is a .cmd
// shim). Spawning a .cmd file on Windows requires shell: true (Node
// throws EINVAL otherwise, a deliberate security fix - .cmd/.bat can't be
// spawned directly by CreateProcess). shell: true then routes through
// cmd.exe, which re-tokenizes the whole command line on whitespace -
// this repo's own path has a space in it ("stickhive 2.0"), so an
// *absolute* wrangler path breaks the same way an unquoted argument
// would. Using a path *relative* to `cwd` (always repoRoot, set below)
// sidesteps this entirely: "node_modules/.bin/wrangler.cmd" has no
// spaces, so there's nothing for cmd.exe's naive parser to split on.
// Every SQL statement also goes through a temp --file (under os.tmpdir(),
// itself space-free on this machine) rather than --command "...", for
// the same reason.
const wranglerBinRelative = path.join("node_modules", ".bin", process.platform === "win32" ? "wrangler.cmd" : "wrangler");

function runWranglerD1File(dbName, sqlFilePath, extraArgs = []) {
  return execFileSync(wranglerBinRelative, ["d1", "execute", dbName, "--local", `--file=${sqlFilePath}`, ...extraArgs], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
  });
}

async function runSqlViaTempFile(dbName, sql, extraArgs, tmpNameHint) {
  const tmpFile = path.join(os.tmpdir(), `stickhive-${tmpNameHint}-${process.pid}-${Date.now()}.sql`);
  try {
    await fsp.writeFile(tmpFile, sql, "utf8");
    return runWranglerD1File(dbName, tmpFile, extraArgs);
  } finally {
    await fsp.rm(tmpFile, { force: true });
  }
}

async function queryAllProducts(dbName) {
  const stdout = await runSqlViaTempFile(dbName, "SELECT * FROM products;", ["--json"], "query");
  const [{ results }] = JSON.parse(stdout);
  return results;
}

// ---------------------------------------------------------------------------
// SQL building
// ---------------------------------------------------------------------------

// wrangler d1 execute --file has no parameter binding - every value goes
// through here. null -> SQL NULL; everything else -> a single-quoted,
// quote-doubled string (numbers/booleans included, since D1/SQLite
// happily coerces a quoted numeral in an INTEGER/REAL column).
function sqlValue(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

const UPSERT_COLUMNS = [
  "slug",
  "filename",
  "name",
  "category",
  "suggested_category",
  "tags",
  "description",
  "price",
  "needs_review",
  "status",
  "content_hash",
  "source_path",
  "created_at",
  "updated_at",
];

// created_at, image_url, thumbnail_url are deliberately NOT in the UPDATE
// SET list (image_url/thumbnail_url aren't even in UPSERT_COLUMNS' VALUES
// at all): re-seeding from the CSV must never wipe out the original
// creation time or a URL set later by the R2 upload step. Matches the
// wishlist-service upsert idiom (backend/wishlist/service.ts).
const UPDATE_SET_COLUMNS = UPSERT_COLUMNS.filter((c) => c !== "slug" && c !== "created_at");

function toRowRecord(row, nowIso) {
  return {
    slug: row.slug,
    filename: row.filename,
    name: row.name,
    category: row.category,
    suggested_category: row.suggested_category || null,
    tags: JSON.stringify(
      String(row.tags ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    ),
    description: row.description,
    price: Number(row.price),
    needs_review: row.needs_review === "true" ? 1 : 0,
    status: row.status,
    content_hash: row.content_hash,
    source_path: row.source_path,
    created_at: nowIso,
    updated_at: nowIso,
  };
}

// Fields to compare when deciding insert vs update vs skip. created_at/
// updated_at are excluded on purpose - they're never part of the CSV's
// own data, so they can never be the reason a row is "changed".
const COMPARE_FIELDS = UPSERT_COLUMNS.filter((c) => c !== "created_at" && c !== "updated_at");

function recordsEqual(a, b) {
  return COMPARE_FIELDS.every((field) => String(a[field] ?? "") === String(b[field] ?? ""));
}

function buildUpsertStatement(records) {
  const values = records
    .map((r) => `(${UPSERT_COLUMNS.map((c) => sqlValue(r[c])).join(", ")})`)
    .join(",\n  ");
  const updateSet = UPDATE_SET_COLUMNS.map((c) => `${c} = excluded.${c}`).join(",\n    ");
  return `INSERT INTO products (${UPSERT_COLUMNS.join(", ")})\nVALUES\n  ${values}\nON CONFLICT(slug) DO UPDATE SET\n    ${updateSet};`;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function findDuplicateSlugs(rows) {
  const counts = new Map();
  for (const row of rows) counts.set(row.slug, (counts.get(row.slug) ?? 0) + 1);
  return [...counts.entries()].filter(([, count]) => count > 1).map(([slug]) => slug);
}

function findMissingFiles(rows, sourceDir) {
  return rows.filter((row) => !row.source_path || !fs.existsSync(path.join(sourceDir, row.source_path))).map((row) => row.slug || row.filename);
}

function findRowsWithNoImage(rows) {
  return rows.filter((row) => !row.source_path || !row.source_path.trim()).map((row) => row.slug || row.filename);
}

async function findOrphanImages(sourceDir, knownHashes) {
  if (!fs.existsSync(sourceDir)) return [];
  const orphans = [];
  const allFiles = await walk(sourceDir);
  for (const absPath of allFiles) {
    const ext = path.extname(absPath).toLowerCase();

    // Mirror cmdScan's exact logic: a convertible file (.avif) is judged
    // by its *converted* (.png) path, not its own - that's the path the
    // CSV's content_hash and EXCLUDED_SOURCE_PATHS actually key off, since
    // scan() converts before hashing/excluding. Using the raw .avif path
    // here would misreport an already-excluded/already-seeded convertible
    // source file as an orphan.
    let effectivePath = absPath;
    let effectiveExt = ext;
    if (CONVERTIBLE_EXTENSIONS.has(ext)) {
      const pngPath = absPath.slice(0, -ext.length) + ".png";
      if (!fs.existsSync(pngPath)) continue; // not yet converted by a scan - not this script's concern
      effectivePath = pngPath;
      effectiveExt = ".png";
    }

    const relPath = path.relative(sourceDir, effectivePath).split(path.sep).join("/");
    if (EXCLUDED_SOURCE_PATHS.has(relPath)) continue; // legitimately absent
    if (!IMAGE_EXTENSIONS.has(effectiveExt)) continue; // not a sticker image (e.g. the stray PDF)

    const hash = await sha256File(effectivePath);
    if (!knownHashes.has(hash)) orphans.push(relPath);
  }
  return [...new Set(orphans)]; // a converted .png and its .avif source both map to the same relPath
}

async function validate(args) {
  const csvPath = path.resolve(getArg(args, "csv", DEFAULT_CSV));
  const sourceDir = path.resolve(getArg(args, "source", DEFAULT_SOURCE));

  const { rows, hashes } = await loadExisting(csvPath);

  const duplicateSlugs = findDuplicateSlugs(rows);
  const missingFiles = findMissingFiles(rows, sourceDir);
  const noImageRows = findRowsWithNoImage(rows);
  const orphans = await findOrphanImages(sourceDir, hashes);

  const blocking = duplicateSlugs.length > 0 || missingFiles.length > 0 || noImageRows.length > 0;

  console.log(`Rows in CSV: ${rows.length}`);
  console.log(`Duplicate slugs: ${duplicateSlugs.length}`);
  for (const s of duplicateSlugs) console.log(`  - ${s}`);
  console.log(`Missing source files: ${missingFiles.length}`);
  for (const s of missingFiles) console.log(`  - ${s}`);
  console.log(`Rows with no image: ${noImageRows.length}`);
  for (const s of noImageRows) console.log(`  - ${s}`);
  console.log(`Orphan images (in source, not in CSV, not excluded) - warning only: ${orphans.length}`);
  for (const p of orphans) console.log(`  - ${p}`);

  return { rows, blocking, missingFiles, duplicateSlugs, noImageRows, orphans };
}

// ---------------------------------------------------------------------------
// seed
// ---------------------------------------------------------------------------

async function seed(args) {
  const dryRun = hasFlag(args, "dry-run");
  const dbName = assertSafeDbName(getArg(args, "db", "stickhive-db"));
  const batchSize = Number(getArg(args, "batch-size", 50));

  const { rows, blocking } = await validate(args);
  if (blocking) {
    console.error("\nValidation failed - aborting before any write. Fix the issues above and re-run.");
    process.exitCode = 1;
    return;
  }

  console.log(`\nReading current D1 state (${dbName}, local)...`);
  const existingProducts = await queryAllProducts(dbName);
  const existingBySlug = new Map(existingProducts.map((r) => [r.slug, r]));

  const nowIso = new Date().toISOString();
  const toInsert = [];
  const toUpdate = [];
  const skippedSlugs = [];

  for (const row of rows) {
    const record = toRowRecord(row, nowIso);
    const existing = existingBySlug.get(record.slug);
    if (!existing) {
      toInsert.push(record);
    } else if (recordsEqual(record, existing)) {
      skippedSlugs.push(record.slug);
    } else {
      // Preserve the real created_at on update - it's not in COMPARE_FIELDS
      // and not in UPDATE_SET_COLUMNS, so this is just for an accurate
      // in-memory record; the actual SQL never touches created_at either way.
      record.created_at = existing.created_at;
      toUpdate.push(record);
    }
  }

  console.log(`\nInserted: ${toInsert.length}, Updated: ${toUpdate.length}, Skipped: ${skippedSlugs.length}, Failed: 0`);

  if (dryRun) {
    console.log("(--dry-run: no changes written)");
    return;
  }

  const toWrite = [...toInsert, ...toUpdate];
  const failed = [];

  for (let i = 0; i < toWrite.length; i += batchSize) {
    const batch = toWrite.slice(i, i + batchSize);
    try {
      await runSqlViaTempFile(dbName, buildUpsertStatement(batch), [], `seed-batch-${i}`);
    } catch (batchError) {
      // Isolate exactly which row(s) in this batch failed by retrying
      // individually, rather than losing the whole batch to one bad row.
      for (const record of batch) {
        try {
          await runSqlViaTempFile(dbName, buildUpsertStatement([record]), [], `seed-row-${record.slug}`);
        } catch (rowError) {
          failed.push({ slug: record.slug, error: rowError instanceof Error ? rowError.message : String(rowError) });
        }
      }
    }
  }

  const actuallyInserted = toInsert.filter((r) => !failed.some((f) => f.slug === r.slug)).length;
  const actuallyUpdated = toUpdate.filter((r) => !failed.some((f) => f.slug === r.slug)).length;

  console.log(`\nFinal: Inserted: ${actuallyInserted}, Updated: ${actuallyUpdated}, Skipped: ${skippedSlugs.length}, Failed: ${failed.length}`);
  for (const f of failed) console.log(`  FAILED ${f.slug}: ${f.error}`);

  if (failed.length > 0) process.exitCode = 1;
}

// ---------------------------------------------------------------------------
// entry point
// ---------------------------------------------------------------------------

const [, , command, ...rest] = process.argv;

switch (command) {
  case "validate": {
    const { blocking } = await validate(rest);
    process.exitCode = blocking ? 1 : 0;
    break;
  }
  case "seed":
    await seed(rest);
    break;
  default:
    console.error("Usage: node scripts/seed-products.mjs <validate|seed> [options]");
    process.exitCode = 1;
}
