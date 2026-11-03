import { cell } from "../packages/memory/src/index.js";
import { effect, computed } from "../packages/runtime/src/index.js";
import { batch, defaultScheduler } from "../packages/scheduler/src/index.js";
import { assert, assertEqual, assertThrows, test } from "./assert.js";

export async function runReactivityTests() {
  console.log("Running Reactivity & Scheduler tests...");

  await test("effect tracks cell reads and updates synchronously on flushSync", () => {
    const count = cell(0);
    let seen = -1;

    effect(() => {
      seen = count.get();
    });

    assertEqual(seen, 0);

    count.set(5);
    defaultScheduler.flushSync();
    assertEqual(seen, 5);
  });

  await test("batch deduplicates multiple updates into a single subscriber run", () => {
    const a = cell(1);
    const b = cell(10);
    let runCount = 0;
    let sum = 0;

    effect(() => {
      runCount++;
      sum = a.get() + b.get();
    });

    assertEqual(runCount, 1);
    assertEqual(sum, 11);

    batch(() => {
      a.set(2);
      a.set(3);
      b.set(20);
    });

    defaultScheduler.flushSync();
    assertEqual(runCount, 2, "Subscriber should only be called once after batch");
    assertEqual(sum, 23);
  });

  await test("computed recomputes lazily and only when dependencies update", () => {
    const first = cell("John");
    const last = cell("Doe");

    const fullName = computed(() => `${first.get()} ${last.get()}`);
    assertEqual(fullName.get(), "John Doe");

    first.set("Jane");
    defaultScheduler.flushSync();
    assertEqual(fullName.get(), "Jane Doe");
  });

  await test("detects and breaks infinite reactive update loops", () => {
    const loopCell = cell(0);

    effect(() => {
      const val = loopCell.get();
      if (val < 2000) {
        loopCell.set(val + 1);
      }
    });

    assertThrows(() => {
      defaultScheduler.flushSync();
    }, "Infinite reactive update cycle detected");
  });
}

