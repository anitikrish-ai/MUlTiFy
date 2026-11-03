/**
 * @mbuf/components
 * Component definition, lifecycle hooks (onMount, onCleanup), and scoped context injection.
 */

import { createScope, registerCleanup } from "@mbuf/runtime";

export type ComponentFactory<P = any> = (props: P) => Node;

export function onMount(fn: () => void): void {
  // Executes on next microtask/tick when node is attached
  queueMicrotask(() => {
    try {
      fn();
    } catch (e) {
      console.error("[mbuf/components] Error in onMount hook:", e);
    }
  });
}

export function onCleanup(fn: () => void): void {
  registerCleanup(fn);
}

export function createComponent<P extends object = {}>(
  factory: (props: P) => Node
): (props?: P) => Node {
  return (props = {} as P) => {
    const { result, dispose } = createScope(() => factory(props));
    
    // Store cleanup handle on the returned DOM node for automatic unmount triggering
    if (result && typeof result === "object") {
      (result as any).__mbuf_dispose__ = dispose;
    }
    return result;
  };
}

export interface Context<T> {
  readonly id: symbol;
  readonly defaultValue: T;
}

const contextValues = new Map<symbol, any>();

export function createContext<T>(defaultValue: T): Context<T> {
  return {
    id: Symbol("mbuf:context"),
    defaultValue
  };
}

export function provideContext<T, R>(context: Context<T>, value: T, fn: () => R): R {
  const prevValue = contextValues.get(context.id);
  contextValues.set(context.id, value);
  try {
    return fn();
  } finally {
    if (prevValue !== undefined) {
      contextValues.set(context.id, prevValue);
    } else {
      contextValues.delete(context.id);
    }
  }
}

export function useContext<T>(context: Context<T>): T {
  if (contextValues.has(context.id)) {
    return contextValues.get(context.id);
  }
  return context.defaultValue;
}

