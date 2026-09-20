#!/usr/bin/env node
// Repeatable sticker intake workflow.
//
// The image-description step (name/tags/description/needs_review) is a
// deliberate human-in-the-loop (or AI-assistant-in-the-loop) step, not
// something this script automates - a person or assistant needs to
// actually look at each sticker. This script only handles the mechanical
// parts:
//
//   scan    - recursively finds images under --source not already in the
//             CSV (deduped by content hash, so re-runs and renames never
//             produce duplicates), converts any .avif to .png in place,
//             and flags non-image files (e.g. a stray .pdf) as skipped.
//   append  - appends a JSON batch of fully-described rows to the CSV,
//             resolving slug collisions.
//   report  - prints summary stats from the current CSV.
//
// Usage:
//   node scripts/sticker-intake.mjs scan   [--source <dir>] [--csv <path>] [--limit N]
//   node scripts/sticker-intake.mjs append --batch <file.json> [--csv <path>]
//   node scripts/sticker-intake.mjs report [--csv <path>]
//
// The real source folder lives outside this repo (see .gitignore's note)
// and is never copied in - raw images are read in place and never committed.

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

const CSV_COLUMNS = [
  "filename",
  "name",
  "slug",
  "category",
  "suggested_category",
  "tags",
  "description",
  "price",
  "needs_review",
  "status",
  "content_hash",
  "source_path",
];

// Extra columns beyond the 8 the brief asked for:
// - content_hash / source_path: content_hash is what makes re-runs and
//   renames dedupe correctly; source_path is what a future seed script
//   needs to actually locate the file to upload to R2.
// - suggested_category: category always stays the parent folder name:
//   this is where a reviewer's re-categorization suggestion goes when a
//   sticker's content doesn't match the folder it happened to land in
//   (e.g. a reaction meme sitting in Anime/), without silently
//   overriding the folder-derived category.
// - status: "draft" for anything needs_review or flagged mature, "active"
//   otherwise - nothing questionable goes live by default.

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const CONVERTIBLE_EXTENSIONS = new Set([".avif"]);

// Source-relative paths (forward slashes) to exclude entirely - no CSV row,
// reported separately from ordinary "not a sticker" skips. Most entries are
// stock imagery, not free-to-use source art: the converted flower image's
// embedded XMP metadata carries a "Rawpixel Ltd." copyright stamp, and the
// lilac-basket image has a visible tiled "Vecteezy" watermark baked right
// into the pixels (an unlicensed preview download, not something usable
// even after editing). One entry is not a licensing issue at all: it's a
// real, identifiable photo of a young, non-consenting child, used as the
// product image itself with profanity - permanently excluded regardless of
// licensing, never a candidate for needs_review, never re-addable by a
// future scan.
const EXCLUDED_SOURCE_PATHS = new Map([
  ["flower stickers/copydwproject7batch2-adj-08-flowerpaintingidea-o.png", "possible stock-photo license (Rawpixel-stamped metadata)"],
  ["flower stickers/6e2695867a1d46ac62dd41422a49f0b8.jpg", "unlicensed stock preview (visible tiled Vecteezy watermark)"],
  ["Rick and Morty/a0d862d9dd72a960975a9c079dc90b29.jpg", "unlicensed stock preview (visible tiled padlock watermark)"],
  ["Rick and Morty/ec4da4b7ad8e8c386336d5c0b724a913.webp.jpg", "not a sticker - fine-art stippled giraffe illustration, no die-cut/sticker styling and unrelated to any category"],
  ["Anime/download.png", "identifiable photo of a real, non-consenting child - permanently excluded, never seeded or uploaded"],
]);

const DEFAULT_SOURCE = String.raw`C:\Users\Yuva\Downloads\drive-download-20260920T111928Z-1-001`;
const DEFAULT_CSV = path.resolve(process.cwd(), "stickers.csv");

// ---------------------------------------------------------------------------
// CSV read/write (hand-rolled RFC4180-ish - no CSV library is a dependency
// yet, and this only ever needs to round-trip data this same script writes)
// ---------------------------------------------------------------------------

function csvEscape(value) {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvRow(fields) {
  return CSV_COLUMNS.map((col) => csvEscape(fields[col])).join(",") + "\n";
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c === "\r") {
      // skip - \n follows
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

async function loadExisting(csvPath) {
  if (!fs.existsSync(csvPath)) {
    return { rows: [], hashes: new Set(), slugs: new Set() };
  }
  const text = await fsp.readFile(csvPath, "utf8");
  const raw = parseCsv(text);
  if (raw.length === 0) return { rows: [], hashes: new Set(), slugs: new Set() };

  const header = raw[0];
  const rows = raw.slice(1).map((r) => {
    const obj = {};
    header.forEach((h, i) => {
      obj[h] = r[i] ?? "";
    });
    return obj;
  });

  return {
    rows,
    hashes: new Set(rows.map((r) => r.content_hash).filter(Boolean)),
    slugs: new Set(rows.map((r) => r.slug).filter(Boolean)),
  };
}

// ---------------------------------------------------------------------------
// Filesystem helpers
// ---------------------------------------------------------------------------

async function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

async function walk(dir) {
  const out = [];
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(full)));
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
  return out;
}

function slugify(base) {
  return (
    base
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "sticker"
  );
}

function uniqueSlug(base, existingSlugs) {
  const candidate = slugify(base);
  if (!existingSlugs.has(candidate)) {
    existingSlugs.add(candidate);
    return candidate;
  }
  let n = 2;
  while (existingSlugs.has(`${candidate}-${n}`)) n++;
  const finalSlug = `${candidate}-${n}`;
  existingSlugs.add(finalSlug);
  return finalSlug;
}

// ---------------------------------------------------------------------------
// CLI arg parsing
// ---------------------------------------------------------------------------

function getArg(args, name, def) {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return def;
  return args[idx + 1];
}

// ---------------------------------------------------------------------------
// scan
// ---------------------------------------------------------------------------

async function cmdScan(args) {
  const source = path.resolve(getArg(args, "source", DEFAULT_SOURCE));
  const csvPath = path.resolve(getArg(args, "csv", DEFAULT_CSV));
  const limit = Number(getArg(args, "limit", Infinity));

  if (!fs.existsSync(source)) {
    console.error(`Source folder not found: ${source}`);
    process.exit(1);
  }

  const { hashes: existingHashes } = await loadExisting(csvPath);
  const allFiles = await walk(source);

  const pending = [];
  const skipped = [];
  const converted = [];
  const excluded = [];
  const seenThisRun = new Set();

  for (const absPath of allFiles) {
    let ext = path.extname(absPath).toLowerCase();
    let effectivePath = absPath;

    const relOf = (p) => path.relative(source, p).split(path.sep).join("/");

    if (CONVERTIBLE_EXTENSIONS.has(ext)) {
      const pngPath = absPath.slice(0, -ext.length) + ".png";
      if (!fs.existsSync(pngPath)) {
        await sharp(absPath).png().toFile(pngPath);
        converted.push({ from: relOf(absPath), to: relOf(pngPath) });
      }
      effectivePath = pngPath;
      ext = ".png";
    } else if (!IMAGE_EXTENSIONS.has(ext)) {
      skipped.push({
        path: relOf(absPath),
        reason: `unsupported file type (${ext || "no extension"}) - not a sticker image`,
      });
      continue;
    }

    const relPath = relOf(effectivePath);
    if (seenThisRun.has(relPath)) continue;
    seenThisRun.add(relPath);

    if (EXCLUDED_SOURCE_PATHS.has(relPath)) {
      excluded.push({ path: relPath, reason: EXCLUDED_SOURCE_PATHS.get(relPath) });
      continue;
    }

    const hash = await sha256File(effectivePath);
    if (existingHashes.has(hash)) continue; // already recorded - handles both re-runs and renames

    pending.push({
      filename: path.basename(effectivePath),
      source_path: relPath,
      category: relPath.split("/")[0],
      content_hash: hash,
    });

    if (pending.length >= limit) break;
  }

  console.error(`Skipped (not stickers): ${skipped.length}`);
  for (const s of skipped) console.error(`  - ${s.path}: ${s.reason}`);

  console.error(`Converted (avif -> png): ${converted.length}`);
  for (const c of converted) console.error(`  - ${c.from} -> ${c.to}`);

  console.error(`Excluded (not skipped, not pending - deliberately left out): ${excluded.length}`);
  for (const e of excluded) console.error(`  - ${e.path}: ${e.reason}`);

  console.error(`New images pending description: ${pending.length}`);
  console.log(JSON.stringify(pending, null, 2));
}

// ---------------------------------------------------------------------------
// append
// ---------------------------------------------------------------------------

async function cmdAppend(args) {
  const csvPath = path.resolve(getArg(args, "csv", DEFAULT_CSV));
  const batchPath = getArg(args, "batch");
  if (!batchPath) {
    console.error("Usage: append --batch <file.json> [--csv <path>]");
    process.exit(1);
  }

  const { rows: existingRows, hashes: existingHashes, slugs: existingSlugs } = await loadExisting(csvPath);
  const batch = JSON.parse(await fsp.readFile(path.resolve(batchPath), "utf8"));

  const isNewFile = existingRows.length === 0 && !fs.existsSync(csvPath);
  let appended = 0;
  let duplicates = 0;
  const lines = [];

  for (const item of batch) {
    const required = ["filename", "name", "category", "description", "content_hash", "source_path"];
    const missing = required.filter((k) => !item[k]);
    if (missing.length > 0) {
      throw new Error(`Batch item missing required field(s) [${missing.join(", ")}]: ${JSON.stringify(item)}`);
    }

    if (existingHashes.has(item.content_hash)) {
      console.warn(`Skipping already-recorded image (duplicate content_hash): ${item.source_path}`);
      duplicates += 1;
      continue;
    }

    const slugBase = item.slug || item.name;
    const slug = uniqueSlug(slugBase, existingSlugs);

    const tagList = Array.isArray(item.tags)
      ? [...item.tags]
      : String(item.tags ?? "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
    const isMature = Boolean(item.is_mature);
    if (isMature && !tagList.includes("mature")) tagList.push("mature");

    const needsReview = Boolean(item.needs_review);
    // Nothing flagged (needs_review) or mature goes live by default.
    const status = needsReview || isMature ? "draft" : "active";

    lines.push(
      csvRow({
        filename: item.filename,
        name: item.name,
        slug,
        category: item.category,
        suggested_category: item.suggested_category ?? "",
        tags: tagList.join(", "),
        description: item.description,
        price: item.price ?? 25,
        needs_review: needsReview ? "true" : "false",
        status,
        content_hash: item.content_hash,
        source_path: item.source_path,
      }),
    );
    existingHashes.add(item.content_hash);
    appended += 1;
  }

  if (lines.length > 0) {
    const header = isNewFile ? CSV_COLUMNS.join(",") + "\n" : "";
    await fsp.appendFile(csvPath, header + lines.join(""), "utf8");
  }

  console.log(`Appended ${appended} row(s) to ${csvPath} (${duplicates} duplicate(s) skipped).`);
}

// ---------------------------------------------------------------------------
// report
// ---------------------------------------------------------------------------

async function cmdReport(args) {
  const csvPath = path.resolve(getArg(args, "csv", DEFAULT_CSV));
  const { rows } = await loadExisting(csvPath);

  const needsReview = rows.filter((r) => r.needs_review === "true").length;
  const active = rows.filter((r) => r.status === "active").length;
  const draft = rows.filter((r) => r.status === "draft").length;
  const slugCounts = new Map();
  for (const r of rows) {
    slugCounts.set(r.slug, (slugCounts.get(r.slug) ?? 0) + 1);
  }
  const duplicateSlugs = [...slugCounts.entries()].filter(([, count]) => count > 1);

  console.log(`Total processed: ${rows.length}`);
  console.log(`needs_review: ${needsReview}`);
  console.log(`status active: ${active}, status draft: ${draft}`);
  console.log(`Duplicate slugs: ${duplicateSlugs.length}`);
  for (const [slug, count] of duplicateSlugs) console.log(`  - ${slug}: ${count} occurrences`);

  const byCategory = new Map();
  for (const r of rows) byCategory.set(r.category, (byCategory.get(r.category) ?? 0) + 1);
  console.log("By category:");
  for (const [category, count] of byCategory) console.log(`  - ${category}: ${count}`);
}

// ---------------------------------------------------------------------------
// entry point
// ---------------------------------------------------------------------------

const [, , command, ...rest] = process.argv;

switch (command) {
  case "scan":
    await cmdScan(rest);
    break;
  case "append":
    await cmdAppend(rest);
    break;
  case "report":
    await cmdReport(rest);
    break;
  default:
    console.error("Usage: node scripts/sticker-intake.mjs <scan|append|report> [options]");
    process.exit(1);
}
