#!/usr/bin/env node
// Optimizes each CSV row's source sticker image into a webp main image
// plus a thumbnail, written to a local, gitignored build directory. Pure
// local file processing - no D1, no R2, nothing remote.
//
// Usage:
//   node scripts/optimize-product-images.mjs [--csv <path>] [--source <dir>] [--out <dir>] [--status active|draft|all] [--slug <slug>]
//
// Runs for every row regardless of status by default (--status all) -
// only the separate R2 *upload* step is active-only; local optimization
// is cheap and useful for previewing drafts too.

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

import { loadExisting, DEFAULT_SOURCE, DEFAULT_CSV } from "./sticker-intake.mjs";

function getArg(args, name, def) {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return def;
  return args[idx + 1];
}

const MAIN_SIZE = 1000;
const MAIN_QUALITY = 85;
const THUMB_SIZE = 300;
const THUMB_QUALITY = 80;

async function optimizeRow(row, sourceDir, outDir) {
  const inputPath = path.join(sourceDir, row.source_path);
  const rowOutDir = path.join(outDir, row.slug);
  await fsp.mkdir(rowOutDir, { recursive: true });

  await sharp(inputPath)
    .resize(MAIN_SIZE, MAIN_SIZE, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: MAIN_QUALITY })
    .toFile(path.join(rowOutDir, "main.webp"));

  await sharp(inputPath)
    .resize(THUMB_SIZE, THUMB_SIZE, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: THUMB_QUALITY })
    .toFile(path.join(rowOutDir, "thumb.webp"));
}

async function main(args) {
  const csvPath = path.resolve(getArg(args, "csv", DEFAULT_CSV));
  const sourceDir = path.resolve(getArg(args, "source", DEFAULT_SOURCE));
  const outDir = path.resolve(getArg(args, "out", path.join(process.cwd(), "public", "product-images-build")));
  const statusFilter = getArg(args, "status", "all");
  const slugFilter = getArg(args, "slug");

  const { rows } = await loadExisting(csvPath);

  const selected = rows.filter((row) => {
    if (slugFilter && row.slug !== slugFilter) return false;
    if (statusFilter !== "all" && row.status !== statusFilter) return false;
    return true;
  });

  let optimized = 0;
  let skippedMissing = 0;

  for (const row of selected) {
    const inputPath = path.join(sourceDir, row.source_path);
    if (!row.source_path || !fs.existsSync(inputPath)) {
      console.warn(`Skipping ${row.slug || row.filename}: source file not found (${row.source_path || "no source_path"})`);
      skippedMissing += 1;
      continue;
    }

    try {
      await optimizeRow(row, sourceDir, outDir);
      optimized += 1;
    } catch (error) {
      console.warn(`Skipping ${row.slug}: ${error instanceof Error ? error.message : error}`);
      skippedMissing += 1;
    }
  }

  console.log(`Optimized: ${optimized}, Skipped (missing/failed source): ${skippedMissing}`);
  console.log(`Output: ${outDir}`);
}

const [, , ...rest] = process.argv;
await main(rest);
