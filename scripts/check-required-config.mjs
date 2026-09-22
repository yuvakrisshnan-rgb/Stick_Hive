#!/usr/bin/env node
// Fails loudly, at deploy time, when a required non-secret runtime config
// value is missing from wrangler.jsonc's "vars" block - this is the exact
// bug class that let STICKHIVE_UPI_ID go missing from production silently
// until a real customer's checkout failed with no warning anywhere in CI.
//
// Run as an explicit step in .github/workflows/deploy.yml, before the
// deploy step, so a push missing a required var never reaches production.
//
// Deliberately zero-dependency (only node: builtins) so it can run before
// `npm ci`, and deliberately does not read process.env: Cloudflare Workers
// vars/secrets are bound at the edge, not exposed to this Node process
// during a GitHub Actions build - wrangler.jsonc's committed "vars" block
// is the actual, checkable source of truth for values meant to live there
// (see the comment above "vars" in wrangler.jsonc for which values that is).

import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const REQUIRED_VARS = ["STICKHIVE_UPI_ID"];

/**
 * Strips // line comments from JSONC while leaving string contents (which
 * may themselves contain "//", e.g. a URL) untouched. wrangler.jsonc uses
 * only // comments today (no block comments) - this still handles both
 * safely by tracking whether we're inside a string.
 */
export function stripJsonComments(source) {
  let result = "";
  let inString = false;
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    const next = source[i + 1];

    if (inString) {
      result += ch;
      if (ch === "\\") {
        result += next ?? "";
        i++;
      } else if (ch === "\"") {
        inString = false;
      }
      continue;
    }

    if (ch === "\"") {
      inString = true;
      result += ch;
      continue;
    }

    if (ch === "/" && next === "/") {
      while (i < source.length && source[i] !== "\n") i++;
      result += "\n";
      continue;
    }

    result += ch;
  }
  return result;
}

export function parseWranglerConfig(source) {
  return JSON.parse(stripJsonComments(source));
}

export function findMissingRequiredVars(vars, required = REQUIRED_VARS) {
  return required.filter((name) => !String(vars?.[name] ?? "").trim());
}

function main() {
  const configPath = path.resolve(process.cwd(), "wrangler.jsonc");
  const source = readFileSync(configPath, "utf8");
  const config = parseWranglerConfig(source);
  const missing = findMissingRequiredVars(config.vars ?? {});

  if (missing.length > 0) {
    console.error(
      `Missing required wrangler.jsonc "vars" entr${missing.length === 1 ? "y" : "ies"}: ${missing.join(", ")}.\n` +
        `These are required for production checkout to function (see the comment above "vars" in wrangler.jsonc) and must be set before deploying.`,
    );
    process.exitCode = 1;
    return;
  }

  console.log(`Required config present in wrangler.jsonc: ${REQUIRED_VARS.join(", ")}.`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main();
}
