/**
 * @mbuf/scheduler
 * Deduplicated microtask batch scheduler with cycle detection and error isolation.
 */

import { DependencyEngine, type Subscriber, defaultDependencyEngine } from "../../dependency/src/index.ts";
import { MemoryEngine, defaultMemoryEngine } from "../../memory/src/index.ts";

export class Scheduler {
  private dependencyEngine: DependencyEngine;
  private memoryEngine: MemoryEngine;
  private queue: Set<Subscriber> = new Set();
  private isScheduled = false;
  private isFlushing = false;
  private batchDepth = 0;
  private maxCycleCount = 1000;

  constructor(
    dependencyEngine: DependencyEngine = defaultDependencyEngine,
    memoryEngine: MemoryEngine = defaultMemoryEngine
  ) {
    this.dependencyEngine = dependencyEngine;
    this.memoryEngine = memoryEngine;
    // When any cell is written, notify all registered subscribers of that cell
    this.memoryEngine.onCellWritten = (cellId) => {
      const subs = this.dependencyEngine.getSubscribers(cellId);
      for (let i = 0; i < subs.length; i++) {
        this.enqueue(subs[i]);
      }
    };
  }

  public enqueue(subscriber: Subscriber): void {
    this.queue.add(subscriber);

    if (this.batchDepth === 0 && !this.isScheduled) {
      this.isScheduled = true;
      queueMicrotask(() => this.flush());
    }
  }

  public batch<T>(fn: () => T): T {
    this.batchDepth++;
    try {
      return fn();
    } finally {
      this.batchDepth--;
      if (this.batchDepth === 0 && this.queue.size > 0 && !this.isScheduled) {
        this.isScheduled = true;
        queueMicrotask(() => this.flush());
      }
    }
  }

  // Synchronously drains pending queue (useful in tests and immediate DOM flushing)
  public flushSync(): void {
    if (this.isFlushing) return;
    this.flush();
  }

  private flush(): void {
    this.isScheduled = false;
    this.isFlushing = true;

    let cycles = 0;

    try {
      while (this.queue.size > 0) {
        cycles++;
        if (cycles > this.maxCycleCount) {
          this.queue.clear();
          throw new Error(`Infinite reactive update cycle detected (exceeded ${this.maxCycleCount} iterations)`);
        }

        // Snapshot current queue and reset to allow re-scheduling
        const tasks = Array.from(this.queue);
        this.queue.clear();

        for (let i = 0; i < tasks.length; i++) {
          const task = tasks[i];
          try {
            task.notify();
          } catch (err) {
            // Error isolation: log error but do not break entire subscriber queue
            console.error("[mbuf/scheduler] Error executing reactive task:", err);
          }
        }
      }
    } finally {
      this.isFlushing = false;
    }
  }
}

export const defaultScheduler = new Scheduler();

// User-facing batch helper
export function batch<T>(fn: () => T): T {
  return defaultScheduler.batch(fn);
}

