// Same rationale as tests/unit/get-client-ip.test.ts: proving the
// production-404 gate deterministically, since a real running dev server
// can't have its own NODE_ENV flipped mid-test.
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";

import { isDevPreviewAllowed } from "../../backend/products/dev-preview-guard.ts";

// See tests/unit/get-client-ip.test.ts for why this cast is needed -
// Next.js declares NODE_ENV readonly in its ambient global types.
function setNodeEnv(value: string | undefined): void {
  (process.env as { NODE_ENV?: string }).NODE_ENV = value;
}

let originalNodeEnv: string | undefined;

beforeEach(() => {
  originalNodeEnv = process.env.NODE_ENV;
});

afterEach(() => {
  setNodeEnv(originalNodeEnv);
});

test("isDevPreviewAllowed() is false in production", () => {
  setNodeEnv("production");
  assert.equal(isDevPreviewAllowed(), false);
});

test("isDevPreviewAllowed() is true in development", () => {
  setNodeEnv("development");
  assert.equal(isDevPreviewAllowed(), true);
});

test("isDevPreviewAllowed() is true when NODE_ENV is unset", () => {
  setNodeEnv(undefined);
  assert.equal(isDevPreviewAllowed(), true);
});
