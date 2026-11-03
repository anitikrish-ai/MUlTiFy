# MUlTiFy — MBUF (Memory-Based UI Framework)

MBUF is an independent, high-performance UI framework engineered around indexed memory cells, fine-grained dependency tracking, and direct, targeted DOM updates.

---

## Key Architectural Principles

1. **Memory-Driven State Execution**: State is stored in indexed memory cells managed by typed metadata arrays with generational validation to eliminate stale reads.
2. **Proportional Work**: Updates execute only the specific DOM operations affected by changed dependencies. No full component re-executions or virtual DOM diffing trees.
3. **Zero Third-Party Runtime Dependencies**: Built from scratch using native browser APIs and TypeScript.
4. **Dedicated Compiler**: Supports the declarative `.mbuf` syntax as well as a TypeScript-first programmatic API.
5. **Integrated SSR & Routing**: Native HTML string emitter (`renderToString`) and client-side reactive router (`createRouter`).

---

## Quick Start (TypeScript / JavaScript API)

```ts
import { memory, ui, createComponent } from "mbuf";

export const Counter = createComponent(() => {
  const count = memory.cell(0);

  return ui.element(
    "div",
    { class: "counter-card" },
    ui.element("h1", null, ui.text(() => `Count: ${count.get()}`)),
    ui.element(
      "button",
      { onClick: () => count.update((n) => n + 1) },
      "Increment"
    )
  );
});

// Mount to DOM
ui.mount(Counter(), "#app");
```

---

## Declarative `.mbuf` Syntax

MBUF features a custom compiler for declarative component syntax:

```mbuf
app CounterApp {
    memory count = 0

    element h1 {
        text: "Count: {count}"
    }

    element button {
        text: "Increment"
        onClick {
            count = count + 1
        }
    }
}
```

Compile directly with the MBUF Compiler:
```ts
import { compile } from "mbuf";

const { code } = compile(mbufSourceString);
// Outputs optimized MBUF runtime code with static hoisting and reactive text bindings.
```

---

## Routing & SSR

```ts
import { router, ui } from "mbuf";

// 1. Reactive Router
const myRouter = router.createRouter({
  routes: {
    "/": () => ui.element("h1", null, "Home"),
    "/about": () => ui.element("h1", null, "About")
  }
});

// 2. Server-Side Rendering
const htmlString = ui.renderToString(myNode);
```

---

## Project Structure

```text
MUlTiFy/
├── packages/
│   ├── memory/        # Indexed memory cells, generational slot recycling
│   ├── dependency/    # Dynamic tracking, bidirectional subscriber graph
│   ├── scheduler/     # Microtask queue, batching, cycle guard
│   ├── runtime/       # effect(), computed(), scope cleanups
│   ├── renderer/      # Targeted DOM engine, when(), each() keyed diff, SSR
│   ├── router/        # Memory-driven client routing
│   ├── devtools/      # Memory slot inspector & floating telemetry panel
│   ├── components/    # createComponent, lifecycle, createContext
│   ├── compiler/      # Lexer, Parser, AST, Code Generator for .mbuf
│   └── mbuf/          # Unified core entry point
├── examples/
│   ├── counter/       # Counter application
│   ├── todo/          # Keyed todo list application
│   ├── datatable/     # Searchable, sortable data table
│   ├── dashboard/     # Real-time reactive telemetry dashboard
│   ├── form/          # Multi-field reactive validation
│   └── cart/          # Reactive shopping cart with coupon calculation
├── benchmarks/        # Reproducible microbenchmarks
├── tests/             # Zero-dependency test suite
├── index.html         # Interactive browser showcase & compiler
├── ARCHITECTURE.md    # In-depth architectural design
├── DEVELOPMENT_STATUS.md # Milestone tracking and roadmap
└── package.json
```

---

## Running the Showcase & Tests

### Interactive Browser Showcase
Open `index.html` directly in any web browser or serve it:
```bash
npx serve .
# Or open index.html directly
```

### Running Tests
```bash
npm test
```

### Running Benchmarks
```bash
npm run bench
```

---

## License

MIT
