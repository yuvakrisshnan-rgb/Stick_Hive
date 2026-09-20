#!/usr/bin/env node
// Uploads scripts/optimize-product-images.mjs's local output to R2, for
// status='active' rows only, then records each row's public image URLs
// in D1. NOT executed as part of the local-only pass this script was
// built in - the R2 bucket doesn't exist yet (see the wrangler commands
// below), and touching real R2/remote D1 needs separate, explicit
// confirmation regardless.
//
// Usage:
//   node scripts/upload-product-images-r2.mjs --confirm --public-base-url <https://pub-...r2.dev> --db-target local|remote [--csv <path>] [--images <dir>]
//
// Setup this script assumes has already happened (commands to run
// yourself, not run by this script or by Claude):
//   wrangler r2 bucket create stickhive-product-images
//   wrangler r2 bucket dev-url enable stickhive-product-images
//   wrangler types
// ...plus R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY /
// R2_BUCKET_NAME in the environment (an R2 API token, separate from any
// wrangler OAuth login - see Cloudflare dashboard > R2 > Manage API
// tokens).

import fs from "node:fs";
import path from "node:path";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { execFileSync } from "node:child_process";
import os from "node:os";
import fsp from "node:fs/promises";

import { getR2Client, getR2BucketName } from "../backend/storage/r2.ts";
import { loadExisting, DEFAULT_CSV } from "./sticker-intake.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");

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

const wranglerBinRelative = path.join("node_modules", ".bin", process.platform === "win32" ? "wrangler.cmd" : "wrangler");

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
        "  wrangler types",
        "  ...and R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET_NAME in the environment.",
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

  const csvPath = path.resolve(getArg(args, "csv", DEFAULT_CSV));
  const imagesDir = path.resolve(getArg(args, "images", path.join(process.cwd(), "public", "product-images-build")));

  const { rows } = await loadExisting(csvPath);
  const activeRows = rows.filter((row) => row.status === "active");

  console.log(`Uploading ${activeRows.length} active row(s) to R2 bucket "${getR2BucketName()}" (db-target: ${dbTargetRaw})...`);

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
      const client = getR2Client();
      const bucket = getR2BucketName();
      await client.send(new PutObjectCommand({ Bucket: bucket, Key: mainKey, Body: fs.readFileSync(mainPath), ContentType: "image/webp" }));
      await client.send(new PutObjectCommand({ Bucket: bucket, Key: thumbKey, Body: fs.readFileSync(thumbPath), ContentType: "image/webp" }));

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
