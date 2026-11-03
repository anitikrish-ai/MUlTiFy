/**
 * MBUF Microbenchmarks & Performance Verification Suite
 * Compares MBUF indexed memory, slot recycling, and fine-grained reactivity.
 */

import { MemoryEngine } from "../packages/memory/src/index.ts";
import { cell } from "../packages/memory/src/index.ts";
import { effect, computed } from "../packages/runtime/src/index.ts";
import { defaultScheduler, batch } from "../packages/scheduler/src/index.ts";

declare const process: any;

function formatMs(ms: number): string {
  return `${ms.toFixed(2)} ms`;
}

export function runBenchmarks() {
  console.log("=================================================");
  console.log("       MBUF PERFORMANCE BENCHMARK SUITE          ");
  console.log("=================================================\n");

  const ITERATIONS = 100_000;

  // 1. Memory Cell Allocation vs Plain Object Allocation
  console.log(`[1] Allocation Benchmark (${ITERATIONS.toLocaleString()} items)`);

  const mem = new MemoryEngine(ITERATIONS);
  const t0 = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    mem.allocate(i);
  }
  const t1 = performance.now();
  const mbufAllocTime = t1 - t0;
  console.log(`  - MBUF Cell Allocation:     ${formatMs(mbufAllocTime)} (${(ITERATIONS / (mbufAllocTime / 1000)).toFixed(0)} ops/sec)`);

  const t2 = performance.now();
  const rawObjects: { value: number }[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    rawObjects.push({ value: i });
  }
  const t3 = performance.now();
  const rawAllocTime = t3 - t2;
  console.log(`  - Raw Object Allocation:    ${formatMs(rawAllocTime)} (${(ITERATIONS / (rawAllocTime / 1000)).toFixed(0)} ops/sec)`);

  // 2. State Mutation Throughput
  console.log(`\n[2] State Mutation Throughput (${ITERATIONS.toLocaleString()} writes)`);
  const testCell = cell(0);
  const t4 = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    testCell.set(i);
  }
  const t5 = performance.now();
  const writeTime = t5 - t4;
  console.log(`  - Cell Direct Writes:       ${formatMs(writeTime)} (${(ITERATIONS / (writeTime / 1000)).toFixed(0)} writes/sec)`);

  // 3. Fine-Grained Reactive Propagation
  console.log(`\n[3] Fine-Grained Reactive Propagation (10,000 notifications)`);
  const REACTIVE_OPS = 10_000;
  const countCell = cell(0);
  let effectRuns = 0;

  const dispose = effect(() => {
    effectRuns++;
    countCell.get();
  });

  const t6 = performance.now();
  for (let i = 0; i < REACTIVE_OPS; i++) {
    countCell.set(i);
    defaultScheduler.flushSync();
  }
  const t7 = performance.now();
  const reactTime = t7 - t6;
  dispose();

  console.log(`  - Reactive Update Cycles:   ${formatMs(reactTime)} (${(REACTIVE_OPS / (reactTime / 1000)).toFixed(0)} updates/sec)`);
  console.log(`  - Total Effect Executions:  ${effectRuns.toLocaleString()}`);

  // 4. Batched Deduplication Throughput
  console.log(`\n[4] Batched Update Throughput (50,000 mutations batched)`);
  const cellA = cell(0);
  const cellB = cell(0);
  let batchedRuns = 0;

  const disposeBatch = effect(() => {
    batchedRuns++;
    cellA.get();
    cellB.get();
  });

  const t8 = performance.now();
  for (let i = 0; i < 25_000; i++) {
    batch(() => {
      cellA.set(i);
      cellB.set(i * 2);
    });
    defaultScheduler.flushSync();
  }
  const t9 = performance.now();
  const batchTime = t9 - t8;
  disposeBatch();

  console.log(`  - Batched Execution Time:   ${formatMs(batchTime)} (${(25_000 / (batchTime / 1000)).toFixed(0)} batches/sec)`);
  console.log(`  - Deduplicated Subscriber Executions: ${batchedRuns.toLocaleString()}`);

  // 5. Generational Slot Recycling
  console.log(`\n[5] Generational Slot Recycling (${ITERATIONS.toLocaleString()} cycles)`);
  const recycleMem = new MemoryEngine(16);
  const t10 = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    const handle = recycleMem.allocate(i);
    handle.dispose();
  }
  const t11 = performance.now();
  const recycleTime = t11 - t10;
  console.log(`  - Alloc + Free Cycles:      ${formatMs(recycleTime)} (${(ITERATIONS / (recycleTime / 1000)).toFixed(0)} cycles/sec)`);
  console.log(`  - Peak Capacity Maintained: ${recycleMem.stats().capacity} (Zero GC Heap Expansion)`);

  console.log("\n=================================================");
  console.log("  Benchmark Completed Successfully.             ");
  console.log("=================================================");
}

if (typeof process !== "undefined" && import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  runBenchmarks();
}
