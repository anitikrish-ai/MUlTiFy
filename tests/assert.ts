/**
 * Lightweight assertion & test runner utility. Zero external dependencies.
 */

export function assert(condition: any, message = "Assertion failed"): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export function assertEqual<T>(actual: T, expected: T, message?: string): void {
  if (!Object.is(actual, expected)) {
    throw new Error(
      `${message ? message + ": " : ""}Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`
    );
  }
}

export function assertThrows(fn: () => void, expectedMessageSubstr?: string): void {
  let threw = false;
  try {
    fn();
  } catch (err: any) {
    threw = true;
    if (expectedMessageSubstr && !String(err.message).includes(expectedMessageSubstr)) {
      throw new Error(`Expected error to include "${expectedMessageSubstr}", got "${err.message}"`);
    }
  }
  if (!threw) {
    throw new Error("Expected function to throw, but it succeeded");
  }
}

export async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
    throw err;
  }
}

