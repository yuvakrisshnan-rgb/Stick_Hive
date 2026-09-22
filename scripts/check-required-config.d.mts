// Type declarations for check-required-config.mjs, so tests/unit/
// check-required-config.test.ts can import it under a `allowJs: false`
// tsconfig without an implicit-any error.

export declare const REQUIRED_VARS: string[];

export declare function stripJsonComments(source: string): string;

export declare function parseWranglerConfig(source: string): {
  vars?: Record<string, unknown>;
  [key: string]: unknown;
};

export declare function findMissingRequiredVars(
  vars: Record<string, unknown> | undefined,
  required?: string[],
): string[];
