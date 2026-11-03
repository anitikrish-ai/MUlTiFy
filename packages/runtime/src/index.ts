/**
 * @mbuf/runtime
 * Reactive runtime primitives: effect, computed, createResource (async), and scope management.
 */

import { cell, MemoryCellHandle, defaultMemoryEngine } from "@mbuf/memory";
import { defaultDependencyEngine, Subscriber, untrack } from "@mbuf/dependency";
import { defaultScheduler } from "@mbuf/scheduler";

export interface EffectHandle {
  dispose(): void;
}

export interface Resource<T> {
  readonly data: MemoryCellHandle<T | undefined>;
  readonly loading: MemoryCellHandle<boolean>;
  readonly error: MemoryCellHandle<any>;
  refetch(): Promise<T>;
}

// Scope context for automatic component/root cleanup
let activeScope: Set<() => void> | null = null;

export function registerCleanup(cleanup: () => void): void {
  if (activeScope) {
    activeScope.add(cleanup);
  }
}

export function createScope<T>(fn: () => T): { result: T; dispose: () => void } {
  const previousScope = activeScope;
  const cleanups = new Set<() => void>();
  activeScope = cleanups;

  try {
    const result = fn();
    return {
      result,
      dispose: () => {
        for (const cleanup of cleanups) {
          try {
            cleanup();
          } catch (err) {
            console.error("[mbuf/runtime] Error in scope cleanup:", err);
          }
        }
        cleanups.clear();
      }
    };
  } finally {
    activeScope = previousScope;
  }
}

/**
 * Creates an effect that runs immediately and re-executes whenever its dependencies change.
 */
export function effect(fn: () => void | (() => void)): () => void {
  let cleanupFn: (() => void) | void;
  let isDisposed = false;

  const subscriberId = defaultDependencyEngine.createSubscriberId();

  const subscriber: Subscriber = {
    id: subscriberId,
    notify: () => {
      if (isDisposed) return;
      run();
    },
    dispose: () => {
      if (cleanupFn) {
        try {
          cleanupFn();
        } catch (e) {
          console.error(e);
        }
        cleanupFn = undefined;
      }
    }
  };

  function run() {
    if (isDisposed) return;
    if (cleanupFn) {
      try {
        cleanupFn();
      } catch (err) {
        console.error("[mbuf/runtime] Error in effect cleanup:", err);
      }
      cleanupFn = undefined;
    }

    cleanupFn = defaultDependencyEngine.runWithSubscriber(subscriber, fn);
  }

  // Initial execution
  run();

  const dispose = () => {
    if (isDisposed) return;
    isDisposed = true;
    defaultDependencyEngine.disposeSubscriber(subscriber);
  };

  registerCleanup(dispose);
  return dispose;
}

/**
 * Creates a derived reactive value. Only recomputes when tracked dependencies change.
 */
export function computed<T>(getter: () => T): MemoryCellHandle<T> {
  const resultCell = cell<T>(undefined as unknown as T);
  let initialized = false;

  effect(() => {
    const val = getter();
    if (!initialized) {
      resultCell.set(val);
      initialized = true;
    } else {
      resultCell.set(val);
    }
  });

  return resultCell;
}

/**
 * Creates an async resource with reactive loading, data, and error state.
 */
export function createResource<T>(fetcher: () => Promise<T>): Resource<T> {
  const data = cell<T | undefined>(undefined);
  const loading = cell<boolean>(true);
  const error = cell<any>(null);

  const execute = async (): Promise<T> => {
    loading.set(true);
    error.set(null);
    try {
      const res = await fetcher();
      data.set(res);
      return res;
    } catch (err) {
      error.set(err);
      throw err;
    } finally {
      loading.set(false);
    }
  };

  // Initial fetch scheduled outside synchronous reactive tracking
  queueMicrotask(() => {
    execute().catch(() => {});
  });

  return {
    data,
    loading,
    error,
    refetch: execute
  };
}

export { untrack };
