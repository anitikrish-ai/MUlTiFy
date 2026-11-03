# MBUF System Architecture & Engineering Specification

**Memory-Based UI Framework (MBUF)** is an independent, production-grade UI runtime and compiler architecture engineered around indexed memory allocation, generational handle validation, and targeted DOM execution.

---

## 1. Core Architectural Philosophy

### Proportional Work Invariant
> *"UI updates must perform work strictly proportional to the invalidated dependencies, independent of the overall application size."*

Traditional UI frameworks organize state and execution around the **component tree**:
- **Virtual DOM (React / Preact)**: State changes re-render entire component subtrees to produce virtual DOM trees, followed by diffing against previous trees to calculate DOM mutations. This introduces `O(Tree_Size)` CPU work and high garbage collection pressure from temporary VNode objects.
- **Proxy-Based Systems (Vue / MobX)**: Wrap state objects in runtime ES Proxies. While reactive, state remains fragmented across hundreds of individual heap objects with unpredictable memory footprints.

**MBUF introduces a Memory-Centric Execution Model**:
- State lives in a contiguous **Indexed Memory Arena**.
- Handle identifiers are compact 32-bit unsigned integers containing an embedded generation counter (`(index << 16) | generation`).
- Subscriptions bind directly from memory slots to targeted DOM operations (e.g., updating `textNode.data` or toggling an attribute).
- Components serve as **setup boundaries and lifecycle scopes**, not units of re-rendering.

---

## 2. Subsystem Architecture

```
+---------------------------------------------------------------------------------+
|                               MBUF Application                                  |
|   (Setup-time component tree, isolated scopes, context providers, routes)      |
+---------------------------------------------------------------------------------+
          |                                                       |
    [State Reads & Writes]                                 [DOM Node Creation]
          v                                                       v
+-------------------------------+                       +-------------------------+
|        Memory Engine          |                       |      DOM Renderer       |
| - 32-bit Packed Handles       |                       | - Targeted Text Nodes   |
| - Uint16Array Generations     |                       | - Keyed List Diff       |
| - Uint32Array Versions        |                       | - Conditional Swapping  |
| - Freelist Slot Recycling     |                       | - Recursive disposeTree |
+-------------------------------+                       +-------------------------+
          |                                                       ^
    [Notifications]                                         [DOM Mutations]
          v                                                       |
+-------------------------------+                       +-------------------------+
|       Dependency Engine       | --------------------> |   Reactive Scheduler    |
| - Dynamic Active Stack        |     (Invalidate)      | - Microtask Queue       |
| - Untrack Scope Boundaries    |                       | - Deduplication Set     |
| - Dynamic Dependency Pruning  |                       | - Infinite Loop Guard   |
+-------------------------------+                       +-------------------------+
```

---

## 3. Deep-Dive: Memory Engine (`@mbuf/memory`)

### A. Generational Slot Validation
To avoid memory leaks, memory cells must be recycled when components or dynamic list items unmount. However, recycling raw indices introduces the classic **stale handle / use-after-free** hazard:
*If cell #4 is disposed and recycled for a new counter, an old component holding a reference to #4 could corrupt the new counter.*

MBUF solves this with **Generational Handles**:
- **Handle Structure**: A 32-bit unsigned integer:
  $$\text{Cell ID} = ((\text{Index} \ll 16) \mid (\text{Generation} \ \& \ \text{0xFFFF})) \ggg 0$$
- **Validation**: On every read or write:
  ```ts
  const index = (cellId >>> 16) & 0xffff;
  const generation = cellId & 0xffff;
  if (index >= this.capacity || this.generations[index] !== generation) {
    throw new Error("Invalid or stale memory cell handle");
  }
  ```
- **Disposal**: When a slot is freed, `generations[index]` is incremented (wrapping at 65535, skipping 0), and `index` is pushed onto the `freeIndices` LIFO stack. Stale handles immediately fail validation.

### B. Typed Metadata Arrays
Cell metadata is segregated into contiguous typed arrays:
- `Uint16Array(capacity)`: Generation counters.
- `Uint32Array(capacity)`: Version counters (incremented on every write).
- Native Array: Arbitrary JavaScript values.

This hybrid structure ensures:
1. Fast cache-coherent numerical checks on the hot validation path.
2. Full JavaScript flexibility for holding objects, arrays, and functions.

---

## 4. Deep-Dive: Dependency Tracking & Reactivity (`@mbuf/dependency`)

### Dynamic Dependency Pruning
In reactive systems with conditional branches:
```ts
effect(() => {
  if (flag.get()) {
    display(a.get());
  } else {
    display(b.get());
  }
});
```
If `flag` flips to `false`, the effect must stop listening to `a`. Retaining `a` as a dependency would cause unnecessary computations and prevent `a` from being garbage collected.

MBUF implements **Automatic Dynamic Pruning**:
1. Before an effect executes, all its existing cell subscriptions are cleared (`clearSubscriberDependencies`).
2. As the effect executes, every cell read registers a fresh link in both directions (`cellToSubscribers` and `subscriberToCells`).
3. If an effect only reads `b`, no link to `a` remains.

### Untrack Boundary
Real-world applications frequently require reading state without subscribing to it (e.g., logging, metrics, or one-off checks). MBUF provides:
- `cell.peek()`: Reads directly from memory bypassing tracking.
- `untrack(fn)`: Pushes `null` onto the active tracking stack, ensuring any cell reads within `fn()` are not registered as dependencies.

---

## 5. Deep-Dive: Reactive Scheduler (`@mbuf/scheduler`)

### Deduplication and Batching
Writing to multiple memory cells in a single user event (e.g., updating first name, last name, and age) should not execute reactive subscribers 3 times.

MBUF uses a two-tier scheduling strategy:
1. **Deduplication Set**: Invalidation pushes subscribers into a `Set<Subscriber>`. Duplicate notifications to the same subscriber within the same tick are collapsed to `O(1)`.
2. **Microtask Batching**: The queue flushes asynchronously via `queueMicrotask`.
3. **Explicit Batching (`batch(fn)`)**: Synchronously delays queue flushing until `fn()` completes.
4. **Infinite Loop Protection**: Cycles (where subscriber execution triggers self-invalidation) are capped at 1,000 iterations to prevent browser lockup.

---

## 6. Deep-Dive: Targeted DOM Renderer (`@mbuf/renderer`)

### Why Virtual DOM Was Rejected
A Virtual DOM creates an intermediate tree of JavaScript objects for every view state, requiring full-tree diffing and garbage collection.

MBUF eliminates the Virtual DOM entirely:
- **Text Bindings**: `ui.text(() => cell.get())` creates a single `Text` node. The reactive effect directly mutates `textNode.data`.
- **Attribute Bindings**: Properties (`value`, `checked`, `disabled`, `class`, `style`) mutate DOM element properties directly.
- **Keyed List Reconciliation**: `ui.each()` reconciles items using a backwards-walk insertion algorithm (`parent.insertBefore(node, refNode)`), maintaining a `Map<Key, Node>`. Only nodes that genuinely moved are inserted; untouched nodes incur zero DOM writes.
- **Full Tree Disposal (`disposeTree`)**: When elements, conditional branches (`when`), or list items (`each`) are removed, MBUF traverses the DOM subtree and invokes all registered cleanups (effects, listeners, subcomponent scopes), eliminating memory leaks.

---

## 7. Deep-Dive: Compiler Architecture (`@mbuf/compiler`)

MBUF includes an independent compiler for the declarative `.mbuf` UI syntax:

```
.mbuf Source Code
       |
       v
 [ 1. Lexer ] --------> Token Stream with line/column tracking
       |
       v
 [ 2. Parser ] -------> Abstract Syntax Tree (ASTApp, ASTElement, ASTMemoryDecl)
       |
       v
 [ 3. Optimizer ] ----> Static Element Hoisting & Constant Propagation
       |
       v
 [ 4. Code Generator ] > Optimized TypeScript/JavaScript MBUF Runtime Code
```

### Static Optimization Pass
The compiler analyzes AST elements to detect static subtrees:
- If an element and its children contain no reactive text bindings (`{count}`) and no event handlers, it is marked `isStatic: true`.
- The code generator hoists static structures, avoiding reactive runtime subscriptions for invariant UI.

---

## 8. Server-Side Rendering (SSR) & Routing

### Headless HTML Emitter (`packages/renderer/src/ssr.ts`)
- `renderToString(node)`: Serializes DOM nodes and component functions into valid HTML strings.
- Escapes special characters (`&`, `<`, `>`, `"`, `'`) to prevent XSS.
- Handles self-closing void elements (`<input />`, `<br />`, `<meta />`).

### Reactive Router (`packages/router/src/index.ts`)
- Route state is stored in a first-class `currentPath` memory cell.
- Route transitions update the cell; `Outlet()` uses `ui.when` to swap route components without reloading the page.
- Supports both Hash and HTML5 History modes.

---

## 9. Architectural Comparison Matrix

| Metric | React (Virtual DOM) | SolidJS (Signals) | MBUF (Memory Cells) |
|---|---|---|---|
| **State Storage** | Component closure state | Heap-allocated Signals | Contiguous Indexed Memory Arena |
| **Slot Recycling** | Rely on GC | Rely on GC | Generational Freelist (`O(1)` zero-GC) |
| **Rendering Strategy** | Virtual DOM Tree Diff | Fine-grained DOM | Targeted Fine-grained DOM |
| **Memory Validation** | Object identity | Closure references | 32-bit Generational Handles |
| **Component Re-run** | Entire function on state change | Setup only (runs once) | Setup only (runs once) |
| **Third-Party Deps** | Multiple packages | Multiple packages | **Zero external dependencies** |

---

## 10. Security & Browser Compatibility

- **XSS Prevention**: `ui.text()` and `renderToString()` use safe entity escaping and native `document.createTextNode()`. No raw `innerHTML` is exposed in public component APIs.
- **Browser Support**: Standard ES2022, `Uint16Array`, `Uint32Array`, `queueMicrotask`, `Map`, `Set`, and standard DOM Level 3. Supported in 100% of modern evergreen browsers (Chrome, Edge, Firefox, Safari).
