#!/usr/bin/env node
// Uploads scripts/optimize-product-images.mjs's local output to R2, for
// status='active' rows only, then records each row's public image URLs
// in D1.
//
// Usage:
//   node scripts/upload-product-images-r2.mjs --confirm --public-base-url <https://pub-...r2.dev> --db-target local|remote [--csv <path>] [--images <dir>]
//
// Setup this script assumes has already happened (commands to run
// yourself, not run by this script):
//   wrangler r2 bucket create stickhive-product-images
//   wrangler r2 bucket dev-url enable stickhive-product-images
//
// Uploads via `wrangler r2 object put` (your existing wrangler
// login/CLOUDFLARE_API_TOKEN), not the AWS S3 SDK - backend/storage/r2.ts's
// S3-compatible client needs a separate R2 API token (R2_ACCOUNT_ID /
// R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET_NAME, created via
// Cloudflare dashboard > R2 > Manage API Tokens - a manual, dashboard-only
// step). Going through wrangler instead reuses the same auth already
// trusted for every other `wrangler d1`/`wrangler r2 bucket` command this
// project's scripts already shell out to, so this script has no extra
// credential of its own to set up. backend/storage/r2.ts's S3 client is
// unused by this script as a result, but is left in place - a real S3
// credential is still the more efficient path if/when one exists (batched
// SDK calls vs. one `wrangler` process per file), and nothing else in this
// project depends on removing it.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import os from "node:os";
import fsp from "node:fs/promises";

import { loadExisting, DEFAULT_CSV } from "./sticker-intake.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const wranglerBinRelative = path.join("node_modules", ".bin", process.platform === "win32" ? "wrangler.cmd" : "wrangler");

function assertSafeBucketName(bucketName) {
  if (!/^[a-zA-Z0-9_-]+$/.test(bucketName)) {
    throw new Error(`Refusing unsafe R2 bucket name: ${JSON.stringify(bucketName)}`);
  }
  return bucketName;
}

// Mirrors runWranglerD1's cwd/shell/relative-binary handling below (see
// its own comment) - the same Windows space-in-path + .cmd-spawn
// constraints apply to every wrangler invocation in this script. This
// repo's own absolute path has a space in it ("stickhive 2.0"), and with
// shell:true the whole command line gets re-tokenized by cmd.exe on
// whitespace even inside a --file=<path> single argument - confirmed by
// running this against the real repo path ("Unknown argument: 2.0\...").
// filePath must be relative to repoRoot (cwd below), same fix already
// used for wranglerBinRelative itself, for the same reason.
function putR2Object(bucketName, key, filePath, contentType, remote) {
  const objectPath = `${assertSafeBucketName(bucketName)}/${key}`;
  const relativeFilePath = path.relative(repoRoot, filePath);
  const modeFlag = remote ? "--remote" : "--local";
  execFileSync(
    wranglerBinRelative,
    ["r2", "object", "put", objectPath, `--file=${relativeFilePath}`, `--content-type=${contentType}`, modeFlag, "-y"],
    { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], shell: true },
  );
}

function getArg(args, name, def) {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return def;
  return args[idx + 1];
}

function hasFlag(args, name) {
  return args.includes(`--${name}`);
}

function assertSafeDbName(dbName) {
  if (!/^[a-zA-Z0-9_-]+$/.test(dbName)) {
    throw new Error(`Refusing unsafe --db value: ${JSON.stringify(dbName)}`);
  }
  return dbName;
}

function sqlValue(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function runWranglerD1(dbName, remote, sql, tmpHint) {
  const tmpFile = path.join(os.tmpdir(), `stickhive-r2upload-${tmpHint}-${process.pid}-${Date.now()}.sql`);
  try {
    await fsp.writeFile(tmpFile, sql, "utf8");
    const modeFlag = remote ? "--remote" : "--local";
    return execFileSync(wranglerBinRelative, ["d1", "execute", dbName, modeFlag, `--file=${tmpFile}`], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
    });
  } finally {
    await fsp.rm(tmpFile, { force: true });
  }
}

async function main(args) {
  const confirmed = hasFlag(args, "confirm") && process.env.CONFIRM_R2_UPLOAD === "yes";
  if (!confirmed) {
    console.error(
      [
        "Refusing to run: this uploads real product images to a real R2 bucket and",
        "writes their URLs into D1.",
        "",
        "Required (both):",
        "  1. Pass --confirm on the command line",
        "  2. Set CONFIRM_R2_UPLOAD=yes in the environment",
        "",
        "Also required before this can work at all:",
        "  wrangler r2 bucket create stickhive-product-images",
        "  wrangler r2 bucket dev-url enable stickhive-product-images",
        "  ...and a wrangler login (or CLOUDFLARE_API_TOKEN) with R2 write access.",
      ].join("\n"),
    );
    process.exitCode = 1;
    return;
  }

  const publicBaseUrl = getArg(args, "public-base-url");
  const dbTargetRaw = getArg(args, "db-target");
  if (!publicBaseUrl) {
    console.error("--public-base-url is required (e.g. https://pub-xxxx.r2.dev)");
    process.exitCode = 1;
    return;
  }
  if (dbTargetRaw !== "local" && dbTargetRaw !== "remote") {
    console.error("--db-target must be exactly 'local' or 'remote' - no default, this is deliberate.");
    process.exitCode = 1;
    return;
  }
  const remote = dbTargetRaw === "remote";
  const dbName = assertSafeDbName(getArg(args, "db", "stickhive-db"));
  const bucketName = assertSafeBucketName(getArg(args, "bucket", "stickhive-product-images"));

  const csvPath = path.resolve(getArg(args, "csv", DEFAULT_CSV));
  const imagesDir = path.resolve(getArg(args, "images", path.join(process.cwd(), "public", "product-images-build")));

  const { rows } = await loadExisting(csvPath);
  const activeRows = rows.filter((row) => row.status === "active");

  console.log(`Uploading ${activeRows.length} active row(s) to R2 bucket "${bucketName}" (db-target: ${dbTargetRaw})...`);

  let uploaded = 0;
  let failed = 0;

  for (const row of activeRows) {
    const mainPath = path.join(imagesDir, row.slug, "main.webp");
    const thumbPath = path.join(imagesDir, row.slug, "thumb.webp");
    if (!fs.existsSync(mainPath) || !fs.existsSync(thumbPath)) {
      console.warn(`Skipping ${row.slug}: optimized images not found (run optimize-product-images.mjs first)`);
      failed += 1;
      continue;
    }

    const mainKey = `products/${row.slug}/main.webp`;
    const thumbKey = `products/${row.slug}/thumb.webp`;

    try {
      // Bucket writes also go through `--remote`/`--local` matching
      // --db-target, so a --db-target local dry run doesn't touch the real
      // bucket either - both the images and the D1 row they're recorded
      // against land in the same place.
      putR2Object(bucketName, mainKey, mainPath, "image/webp", remote);
      putR2Object(bucketName, thumbKey, thumbPath, "image/webp", remote);

      const imageUrl = `${publicBaseUrl.replace(/\/$/, "")}/${mainKey}`;
      const thumbnailUrl = `${publicBaseUrl.replace(/\/$/, "")}/${thumbKey}`;
      const nowIso = new Date().toISOString();

      const sql = `UPDATE products SET image_url = ${sqlValue(imageUrl)}, thumbnail_url = ${sqlValue(thumbnailUrl)}, updated_at = ${sqlValue(nowIso)} WHERE slug = ${sqlValue(row.slug)};`;
      await runWranglerD1(dbName, remote, sql, row.slug);

      uploaded += 1;
    } catch (error) {
      console.warn(`Failed ${row.slug}: ${error instanceof Error ? error.message : error}`);
      failed += 1;
    }
  }

  console.log(`\nUploaded: ${uploaded}, Failed: ${failed}`);
  if (failed > 0) process.exitCode = 1;
}

const [, , ...rest] = process.argv;
await main(rest);
