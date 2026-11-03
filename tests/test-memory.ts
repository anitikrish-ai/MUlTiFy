import { MemoryEngine } from "../packages/memory/src/index.ts";
import { assert, assertEqual, assertThrows, test } from "./assert.ts";

export async function runMemoryTests() {
  console.log("Running Memory Engine tests...");

  await test("allocates cell and stores initial value", () => {
    const mem = new MemoryEngine(16);
    const cell = mem.allocate(42);
    assertEqual(cell.get(), 42);
    assertEqual(cell.version(), 1);
    assertEqual(cell.isAlive(), true);
  });

  await test("increments version on mutation and ignores identical writes", () => {
    const mem = new MemoryEngine(16);
    const cell = mem.allocate("initial");
    cell.set("updated");
    assertEqual(cell.get(), "updated");
    assertEqual(cell.version(), 2);

    // Identical write should be a no-op
    cell.set("updated");
    assertEqual(cell.version(), 2);
  });

  await test("generation guard prevents reading stale disposed cell handles", () => {
    const mem = new MemoryEngine(2);
    const cellA = mem.allocate("First");
    const cellAId = cellA.id;
    cellA.dispose();

    assertEqual(cellA.isAlive(), false);
    assertThrows(() => cellA.get(), "Invalid or stale memory cell read");

    // Allocate in the recycled slot
    const cellB = mem.allocate("Second");
    assertEqual(cellB.get(), "Second");

    // Reading old handle should still fail because generation mismatch
    assertThrows(() => mem.read(cellAId), "Invalid or stale memory cell read");
  });

  await test("auto-grows when capacity is exceeded", () => {
    const mem = new MemoryEngine(4);
    const cells = [];
    for (let i = 0; i < 10; i++) {
      cells.push(mem.allocate(i * 10));
    }
    assertEqual(cells[9].get(), 90);
    assert(mem.stats().capacity >= 16);
  });
}

