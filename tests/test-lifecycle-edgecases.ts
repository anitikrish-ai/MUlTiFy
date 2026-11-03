import { MemoryEngine } from "../packages/memory/src/index.ts";
import { defaultDependencyEngine, untrack } from "../packages/dependency/src/index.ts";
import { cell } from "../packages/memory/src/index.ts";
import { effect, createResource } from "../packages/runtime/src/index.ts";
import { defaultScheduler } from "../packages/scheduler/src/index.ts";
import { disposeTree, attachCleanup } from "../packages/renderer/src/index.ts";
import { assert, assertEqual, assertThrows, test } from "./assert.ts";

export async function runLifecycleEdgeCaseTests() {
  console.log("Running Lifecycle & Advanced Edge-Case tests...");

  await test("cell.peek() reads current value without subscribing to active effect", () => {
    const a = cell(10);
    const b = cell(20);
    let runs = 0;
    let recordedSum = 0;

    const dispose = effect(() => {
      runs++;
      // Subscribes to 'a', but only peeks 'b'
      recordedSum = a.get() + b.peek();
    });

    assertEqual(runs, 1);
    assertEqual(recordedSum, 30);

    // Mutating 'b' should NOT trigger effect
    b.set(99);
    defaultScheduler.flushSync();
    assertEqual(runs, 1, "Effect should not re-run on peeked cell change");
    assertEqual(recordedSum, 30);

    // Mutating 'a' should trigger effect and pick up new 'b'
    a.set(15);
    defaultScheduler.flushSync();
    assertEqual(runs, 2);
    assertEqual(recordedSum, 114);

    dispose();
  });

  await test("untrack() blocks subscription across closure boundaries", () => {
    const trackedCell = cell(1);
    const untrackedCell = cell(100);
    let runs = 0;

    const dispose = effect(() => {
      runs++;
      trackedCell.get();
      untrack(() => {
        untrackedCell.get();
      });
    });

    assertEqual(runs, 1);

    untrackedCell.set(200);
    defaultScheduler.flushSync();
    assertEqual(runs, 1, "untrack() must prevent dependency registration");

    dispose();
  });

  await test("disposeTree recursively unbinds registered cleanups across DOM hierarchy", () => {
    let childCleaned = false;
    let grandchildCleaned = false;

    // Simulate DOM hierarchy with mock nodes if run in headless node
    const parent = { firstChild: null as any, nextSibling: null as any };
    const child = { firstChild: null as any, nextSibling: null as any };
    const grandchild = { firstChild: null as any, nextSibling: null as any };

    parent.firstChild = child;
    child.firstChild = grandchild;

    attachCleanup(child as any, () => {
      childCleaned = true;
    });
    attachCleanup(grandchild as any, () => {
      grandchildCleaned = true;
    });

    disposeTree(parent as any);

    assertEqual(childCleaned, true, "Child cleanup must be called");
    assertEqual(grandchildCleaned, true, "Grandchild cleanup must be called");
  });

  await test("high-throughput generational reuse stays stable over 10,000 cycles", () => {
    const mem = new MemoryEngine(16);
    for (let cycle = 0; cycle < 10_000; cycle++) {
      const c = mem.allocate(`val_${cycle}`);
      const id = c.id;
      assertEqual(c.get(), `val_${cycle}`);
      c.dispose();
      assertThrows(() => mem.read(id), "Invalid or stale memory cell read");
    }
    // Freelist stack ensures capacity never grew past the initial batch
    assertEqual(mem.stats().allocated, 0);
  });
}

