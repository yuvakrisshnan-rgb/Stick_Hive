// Run with: node --test tests/unit
//
// Covers scripts/check-required-config.mjs, the deploy-time gate that
// fails the GitHub Actions workflow if a required wrangler.jsonc "vars"
// entry (e.g. STICKHIVE_UPI_ID) is missing - the exact bug class that let
// UPI checkout go live broken in production undetected. This file is
// zero-dependency (only node: builtins), so unlike backend/orders/
// service.ts it imports cleanly under plain `node --test`.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  findMissingRequiredVars,
  parseWranglerConfig,
  stripJsonComments,
} from "../../scripts/check-required-config.mjs";

test("findMissingRequiredVars flags STICKHIVE_UPI_ID when absent", () => {
  assert.deepEqual(findMissingRequiredVars({ PRODUCTS_SOURCE: "d1" }), ["STICKHIVE_UPI_ID"]);
});

test("findMissingRequiredVars is satisfied once STICKHIVE_UPI_ID is set", () => {
  assert.deepEqual(findMissingRequiredVars({ STICKHIVE_UPI_ID: "stickhive@upi" }), []);
});

test("findMissingRequiredVars treats a blank/whitespace-only value as still missing", () => {
  assert.deepEqual(findMissingRequiredVars({ STICKHIVE_UPI_ID: "   " }), ["STICKHIVE_UPI_ID"]);
});

test("findMissingRequiredVars handles a completely missing vars object", () => {
  assert.deepEqual(findMissingRequiredVars(undefined), ["STICKHIVE_UPI_ID"]);
});

test("stripJsonComments removes // comments without touching string contents (e.g. a URL)", () => {
  const source = '{\n  // a comment\n  "a": "https://example.com", // trailing comment\n  "b": 1\n}';
  const stripped = stripJsonComments(source);
  const parsed = JSON.parse(stripped);
  assert.equal(parsed.a, "https://example.com");
  assert.equal(parsed.b, 1);
});

test("parseWranglerConfig parses a realistic commented JSONC document", () => {
  const source = [
    "{",
    '  // Non-sensitive config.',
    '  "vars": {',
    '    "STICKHIVE_UPI_NAME": "Stick Hive" // trailing',
    "  }",
    "}",
  ].join("\n");
  const config = parseWranglerConfig(source);
  assert.equal(config.vars?.STICKHIVE_UPI_NAME, "Stick Hive");
});

test("parseWranglerConfig parses the real committed wrangler.jsonc without throwing", () => {
  const source = readFileSync(new URL("../../wrangler.jsonc", import.meta.url), "utf8");
  const config = parseWranglerConfig(source);
  assert.ok(config.vars, "wrangler.jsonc must have a vars block");
});
