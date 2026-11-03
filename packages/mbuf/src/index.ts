/**
 * MBUF — Memory-Based UI Framework
 * Main Unified Entry Point
 */

import { cell, defaultMemoryEngine, type MemoryCellHandle, type MemoryStats } from "../../memory/src/index.ts";
import { defaultDependencyEngine, untrack } from "../../dependency/src/index.ts";
import { defaultScheduler, batch } from "../../scheduler/src/index.ts";
import { effect, computed, createResource, createScope, registerCleanup, type Resource } from "../../runtime/src/index.ts";
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
  type ChildNode,
  type ElementProps
} from "../../renderer/src/index.ts";
import {
  createComponent,
  onMount,
  onCleanup,
  createContext,
  useContext,
  provideContext,
  type Context
} from "../../components/src/index.ts";
import { compile, Lexer, Parser, CodeGenerator } from "../../compiler/src/index.ts";
import { createRouter, type RouterOptions, type RouterInstance } from "../../router/src/index.ts";
import { inspectMemory, createDevToolsPanel, type CellSnapshot } from "../../devtools/src/index.ts";

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
