/**
 * Global ambient declarations for Node.js / browser environment compatibility.
 */

declare const process: {
  argv: string[];
  exit(code?: number): never;
  env: Record<string, string | undefined>;
  [key: string]: any;
};

