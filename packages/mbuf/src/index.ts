/**
 * MBUF — Memory-Based UI Framework
 * Main Unified Entry Point
 */

import { cell, defaultMemoryEngine, MemoryCellHandle, MemoryStats } from "@mbuf/memory";
import { defaultDependencyEngine, untrack } from "@mbuf/dependency";
import { defaultScheduler, batch } from "@mbuf/scheduler";
import { effect, computed, createResource, createScope, registerCleanup, Resource } from "@mbuf/runtime";
import {
  element,
  text,
  fragment,
  when,
  each,
  mount,
  renderToString,
  attachCleanup,
  disposeTree,
  ChildNode,
  ElementProps
} from "@mbuf/renderer";
import {
  createComponent,
  onMount,
  onCleanup,
  createContext,
  useContext,
  provideContext,
  Context
} from "@mbuf/components";
import { compile, Lexer, Parser, CodeGenerator } from "@mbuf/compiler";
import { createRouter, RouterOptions, RouterInstance } from "@mbuf/router";
import { inspectMemory, createDevToolsPanel, CellSnapshot } from "@mbuf/devtools";

// 1. Unified Memory API
export const memory = {
  cell,
  create: cell,
  allocate: <T>(val: T) => defaultMemoryEngine.allocate(val),
  computed,
  effect,
  batch,
  untrack,
  createResource,
  stats: (): MemoryStats => defaultMemoryEngine.stats(),
  isValid: (id: number) => defaultMemoryEngine.isValid(id),
  free: (id: number) => defaultMemoryEngine.free(id)
};

// 2. Unified UI API
export const ui = {
  element,
  text,
  fragment,
  when,
  each,
  mount,
  renderToString,
  attachCleanup,
  disposeTree
};

// 3. Unified Component API
export const component = {
  create: createComponent,
  onMount,
  onCleanup,
  createContext,
  useContext,
  provideContext
};

// 4. Unified Router API
export const router = {
  createRouter
};

// 5. Unified DevTools API
export const devtools = {
  inspectMemory,
  createDevToolsPanel
};

// Re-export core primitives for direct import
export {
  cell,
  effect,
  computed,
  batch,
  untrack,
  createResource,
  element,
  text,
  fragment,
  when,
  each,
  mount,
  renderToString,
  attachCleanup,
  disposeTree,
  createComponent,
  onMount,
  onCleanup,
  createContext,
  useContext,
  provideContext,
  createRouter,
  compile,
  inspectMemory,
  createDevToolsPanel,
  defaultMemoryEngine,
  defaultDependencyEngine,
  defaultScheduler
};

export type {
  MemoryCellHandle,
  MemoryStats,
  ChildNode,
  ElementProps,
  Context,
  RouterOptions,
  RouterInstance,
  CellSnapshot,
  Resource
};
