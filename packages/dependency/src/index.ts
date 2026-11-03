/**
 * @mbuf/dependency
 * Fine-grained dependency tracking engine with dynamic re-subscription,
 * untrack capability, and complete memory leak prevention.
 */

import { MemoryEngine, defaultMemoryEngine } from "@mbuf/memory";

export interface Subscriber {
  readonly id: number;
  notify(): void;
  // Cleanup hook invoked when subscriber is disposed
  dispose?: () => void;
}

export class DependencyEngine {
  private nextSubscriberId = 1;
  // cellId -> Set of subscriber IDs
  private cellToSubscribers: Map<number, Set<number>> = new Map();
  // subscriberId -> Set of cell IDs
  private subscriberToCells: Map<number, Set<number>> = new Map();
  // subscriberId -> Subscriber instance
  private subscriberRegistry: Map<number, Subscriber> = new Map();

  // Active subscriber stack for nested tracking
  private activeStack: (Subscriber | null)[] = [];

  constructor(private memory: MemoryEngine = defaultMemoryEngine) {
    this.memory.onCellRead = (cellId) => {
      this.track(cellId);
    };
  }

  public get currentSubscriber(): Subscriber | null {
    if (this.activeStack.length === 0) return null;
    return this.activeStack[this.activeStack.length - 1];
  }

  // Registers a read dependency if a subscriber is currently executing and tracking is active
  public track(cellId: number): void {
    const current = this.currentSubscriber;
    if (!current) return;

    let subSet = this.cellToSubscribers.get(cellId);
    if (!subSet) {
      subSet = new Set();
      this.cellToSubscribers.set(cellId, subSet);
    }
    subSet.add(current.id);

    let cellSet = this.subscriberToCells.get(current.id);
    if (!cellSet) {
      cellSet = new Set();
      this.subscriberToCells.set(current.id, cellSet);
    }
    cellSet.add(cellId);
  }

  // Runs a computation inside a tracking scope
  public runWithSubscriber<T>(subscriber: Subscriber, fn: () => T): T {
    this.subscriberRegistry.set(subscriber.id, subscriber);
    // Dynamic tracking: clear previous cell dependencies before re-evaluating
    this.clearSubscriberDependencies(subscriber.id);

    this.activeStack.push(subscriber);
    try {
      return fn();
    } finally {
      this.activeStack.pop();
    }
  }

  /**
   * Executes a function with dependency tracking paused.
   * Useful for reading cells in effects or event handlers without subscribing.
   */
  public untrack<T>(fn: () => T): T {
    this.activeStack.push(null);
    try {
      return fn();
    } finally {
      this.activeStack.pop();
    }
  }

  // Clears dependency links between subscriber and cells
  private clearSubscriberDependencies(subId: number): void {
    const cells = this.subscriberToCells.get(subId);
    if (!cells) return;

    for (const cellId of cells) {
      const subs = this.cellToSubscribers.get(cellId);
      if (subs) {
        subs.delete(subId);
        if (subs.size === 0) {
          this.cellToSubscribers.delete(cellId);
        }
      }
    }
    cells.clear();
  }

  // Returns all subscribers listening to a cell
  public getSubscribers(cellId: number): Subscriber[] {
    const subIds = this.cellToSubscribers.get(cellId);
    if (!subIds || subIds.size === 0) return [];

    const result: Subscriber[] = [];
    for (const id of subIds) {
      const sub = this.subscriberRegistry.get(id);
      if (sub) result.push(sub);
    }
    return result;
  }

  // Unregisters a subscriber completely
  public disposeSubscriber(subscriber: Subscriber): void {
    const subId = subscriber.id;
    this.clearSubscriberDependencies(subId);
    this.subscriberToCells.delete(subId);
    this.subscriberRegistry.delete(subId);
    if (subscriber.dispose) {
      try {
        subscriber.dispose();
      } catch (err) {
        console.error("[mbuf/dependency] Error in subscriber dispose:", err);
      }
    }
  }

  public createSubscriberId(): number {
    return this.nextSubscriberId++;
  }
}

export const defaultDependencyEngine = new DependencyEngine();

export function untrack<T>(fn: () => T): T {
  return defaultDependencyEngine.untrack(fn);
}
