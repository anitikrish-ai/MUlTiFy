# MASTER BUILD PROMPT — MUlTiFy { MBUF }
## Memory-Based UI Framework | Independent Framework Engineering

Act as a senior framework architect, compiler engineer, runtime engineer, and performance optimization specialist.

Your task is to design and build **MBUF (Memory-Based UI Framework)** from scratch as a genuinely useful, independent, production-oriented UI framework.

This is a new framework project. Do not turn it into a React wrapper, Vue wrapper, Solid wrapper, or a renamed version of an existing framework.

The objective is to create a distinctive memory-driven UI execution architecture with its own memory engine, dependency system, scheduler, renderer, compiler, developer APIs, tooling, and documentation.

Do not merely generate a landing page, architecture diagram, or static prototype. Build the actual working framework.

---

# 1. CORE VISION

MBUF should explore an alternative to traditional component-tree-centric UI execution.

Its core architectural principle:

"UI updates should perform work proportional to the affected dependencies rather than the size of the entire application."

Design MBUF around:

- Memory-driven state management.
- Indexed memory cells and references.
- Fine-grained dependency tracking.
- Efficient reactive scheduling.
- Direct and targeted DOM updates.
- Compiler-assisted execution optimization.
- Predictable memory allocation and cleanup.
- Minimal unnecessary computations.
- Low runtime overhead.
- Excellent developer experience.

Do not claim that the architecture is automatically faster than existing frameworks. Establish performance through reproducible benchmarks.

# 2. PROJECT INDEPENDENCE

Build MBUF as an independent open-source framework.

Requirements:

- Its own identity, architecture and package namespace.
- Its own runtime implementation.
- Its own developer-facing API.
- Its own compiler and syntax when appropriate.
- Its own documentation.
- Its own examples.
- Its own testing and benchmarking infrastructure.

Do not import React, Vue, Angular, Solid or another UI framework as an internal dependency.

Using standard browser APIs, TypeScript, Vite, Rollup, testing libraries and development tools is allowed.

Avoid copying existing framework source code or presenting established techniques as original inventions.

Research existing approaches when useful and clearly distinguish established techniques from MBUF-specific innovations.

# 3. TECHNOLOGY STACK

Use a maintainable, performance-conscious stack.

Core:
- TypeScript.
- Modern JavaScript.
- ES Modules.
- Strict TypeScript configuration.

Runtime:
- Indexed memory storage.
- Typed arrays for numeric metadata.
- Integer-based references.
- Reusable buffers.
- Efficient subscriber structures.
- Native browser DOM APIs.

Compiler:
- Custom lexer.
- Parser.
- AST.
- Semantic analysis.
- Intermediate representation.
- Code generation.
- Optimization passes.

Development:
- Vite.
- Vitest.
- Playwright.
- Tinybench.
- TypeScript declarations.
- ESLint.
- Prettier.

Use stable, compatible package versions. Avoid unnecessary dependencies.

# 4. SYSTEM ARCHITECTURE

Organize MBUF into independent modules.

## A. Memory Engine

Implement:

- Memory cell allocation.
- Integer cell identifiers.
- Read/write operations.
- Version tracking.
- Slot reuse.
- Memory disposal.
- Capacity management.
- Reference validation.
- Memory inspection.
- Efficient value storage.

Use hybrid storage:
- Typed arrays for metadata.
- JavaScript arrays or appropriate storage for arbitrary values.
- Compact reference structures.

Prevent stale references when memory slots are reused. Use generation counters or another safe handle-validation strategy.

## B. Dependency Engine

Implement:

- Dependency registration.
- Subscriber lookup.
- Dependency tracking.
- Subscription cleanup.
- Dynamic dependency changes.
- Duplicate subscription prevention.
- Efficient invalidation.
- Cycle detection or safe cycle handling.

Do not scan the entire application to identify affected UI elements.

## C. Reactive Scheduler

Implement:

- Update queues.
- Deduplication.
- Batching.
- Priority handling where justified.
- Controlled execution.
- Microtask scheduling.
- Animation-frame integration.
- Error isolation.
- Reentrancy protection.
- Infinite-update protection.

Avoid unnecessary allocations during update execution.

## D. DOM Renderer

Build a native DOM rendering engine.

Support:

- Element creation.
- Text bindings.
- Attribute bindings.
- Property bindings.
- Class and style updates.
- Event handling.
- Conditional rendering.
- Keyed lists.
- Component mounting.
- Component disposal.
- Event listener cleanup.
- Fragment support.

Apply targeted DOM mutations rather than rebuilding complete application structures.

Cache static structures where beneficial.

Prevent unnecessary layout reads and writes.

## E. Component System

Provide:

- Component definitions.
- Component composition.
- Props.
- Local state.
- Shared state.
- Lifecycle management.
- Context or dependency injection.
- Slots or equivalent composition mechanisms.
- Component cleanup.

Do not introduce a virtual DOM unless a specific, benchmark-supported use case justifies it.

## F. Compiler

Create a custom MBUF compiler.

Implement:

1. Lexer.
2. Parser.
3. AST representation.
4. Semantic validation.
5. Intermediate representation.
6. Code generation.
7. Source maps where practical.
8. Helpful compiler errors.

Support optimization passes:

- Constant folding.
- Static content hoisting.
- Dead-code elimination.
- Binding specialization.
- Instruction fusion.
- Unused dependency elimination.
- Static expression analysis.

Do not build a custom language merely for appearance. Its syntax must improve usability or compilation.

# 5. DEVELOPER EXPERIENCE

MBUF must be pleasant to use.

Design a clear API such as:

```ts
import { memory, ui } from "mbuf";

const count = memory.create(0);

const heading = ui.text(
  () => `Count: ${count.get()}`
);

ui.mount(heading, "#app");

count.set(10);
```

This is a proposed API. Refine it where architectural improvements are justified.

Eventually support an optional custom syntax:

```mbuf
app Counter {
    memory count = 0

    element heading {
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

The compiler must translate custom syntax into actual MBUF runtime instructions.

Also support a TypeScript-first workflow.

Provide:

- Clear imports.
- Predictable APIs.
- TypeScript types.
- Useful errors.
- Development warnings.
- Debugging tools.
- Good documentation.
- Minimal configuration.

# 6. PERFORMANCE ENGINEERING

Performance is a core engineering requirement, not a marketing feature.

Optimize:

## Memory
- Avoid unnecessary object allocations.
- Reuse internal buffers.
- Use compact metadata.
- Avoid memory leaks.
- Manage slot reuse safely.
- Reduce garbage collection pressure.

## Reactivity
- Track only actual dependencies.
- Avoid unnecessary subscriber notifications.
- Deduplicate scheduled work.
- Avoid redundant value comparisons.
- Handle dynamic dependencies efficiently.

## Rendering
- Minimize DOM mutations.
- Reuse nodes.
- Optimize keyed lists.
- Batch appropriate writes.
- Avoid full application rerenders.
- Prevent layout thrashing.

## Compiler
- Optimize static expressions.
- Generate specialized binding operations.
- Eliminate unused instructions.
- Reduce generated bundle size.

## Runtime
- Keep production runtime small.
- Avoid unnecessary abstractions.
- Keep hot paths simple.
- Use profiling before changing data structures.
- Avoid expensive work in frequently executed paths.

Do not use WebAssembly, multithreading or SharedArrayBuffer just for marketing. Introduce them only when benchmarks establish a real benefit and the design is safe.

# 7. ADVANCED FEATURES

Design the architecture so that the following can be added without rewriting the core:

- Server-side rendering.
- Hydration.
- Streaming rendering.
- Web Components integration.
- Web Workers.
- Reactive stores.
- Routing.
- Forms.
- Animation integration.
- Lazy loading.
- Async components.
- Error boundaries.
- DevTools.
- Hot module replacement.
- Plugin API.
- Accessibility utilities.

Do not implement all advanced features prematurely. Prioritize a stable core and build each feature independently.

# 8. PROJECT STRUCTURE

Use a modular monorepo.

```text
mbuf/
│
├── packages/
│   ├── memory/
│   ├── dependency/
│   ├── scheduler/
│   ├── renderer/
│   ├── compiler/
│   ├── runtime/
│   ├── components/
│   ├── router/
│   ├── devtools/
│   └── mbuf/
│
├── playground/
├── examples/
│   ├── counter/
│   ├── todo/
│   ├── dashboard/
│   ├── ecommerce/
│   └── complex-app/
│
├── benchmarks/
│   ├── memory/
│   ├── rendering/
│   ├── reactivity/
│   ├── lists/
│   └── comparisons/
│
├── tests/
├── docs/
├── scripts/
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
├── README.md
├── LICENSE
└── CONTRIBUTING.md
```

Adjust the structure when technically justified. Do not create empty packages just to fill the structure.

# 9. REAL-WORLD APPLICATION TESTING

MBUF must prove it can support actual applications.

Build these examples using MBUF itself:

1. Counter application.
2. Todo application.
3. Searchable and filterable data table.
4. Dashboard with reactive charts.
5. Form validation application.
6. Shopping cart interface.
7. Multi-component application with shared state.
8. Large-list rendering demonstration.

All examples must use real working functionality.

Do not create fake buttons, placeholder interactions or simulated framework capabilities.

# 10. PERFORMANCE BENCHMARKS

Build reproducible comparisons against:

- React production build.
- SolidJS production build.
- Preact production build.
- MBUF production build.

Measure:

- Initial render time.
- Update latency.
- Memory consumption.
- JavaScript bundle size.
- DOM mutation count.
- Large-list performance.
- Frequent state updates.
- Component creation and disposal.
- Garbage collection behaviour where measurable.

Use identical application logic, datasets, browser versions and hardware.

Include:
- Benchmark scripts.
- Raw results.
- Environment information.
- Repeated measurements.
- Median and percentile reporting.
- Clear methodology.
- Reproducible instructions.

Never invent benchmark results or claim MBUF is the fastest without evidence.

# 11. QUALITY AND RELIABILITY

Implement:

- Strict TypeScript.
- Unit tests.
- Integration tests.
- Browser tests.
- Memory lifecycle tests.
- Dependency cleanup tests.
- Scheduler stress tests.
- Compiler validation tests.
- Runtime error handling.
- Security-conscious DOM handling.
- Accessibility support.

Test edge cases:

- Null and undefined values.
- Repeated updates.
- Nested dependencies.
- Dynamic dependencies.
- Component unmounting.
- Memory slot reuse.
- Circular updates.
- Large applications.
- Async operations.
- Event listener cleanup.

Never sacrifice correctness for a small benchmark improvement.

# 12. DOCUMENTATION

Create professional documentation covering:

- What MBUF is.
- Architecture overview.
- Installation.
- Quick start.
- Memory system.
- Dependency engine.
- Scheduler.
- Renderer.
- Component system.
- Compiler.
- API reference.
- Performance.
- Benchmarks.
- Examples.
- Troubleshooting.
- Contributing.

Provide runnable examples, not only descriptions.

# 13. DEVELOPMENT METHODOLOGY

Follow this exact implementation sequence:

Phase 1: Architecture and technical specification.

Phase 2: Repository and workspace setup.

Phase 3: Memory engine.

Phase 4: Dependency engine.

Phase 5: Reactive scheduler.

Phase 6: DOM renderer.

Phase 7: First working counter application.

Phase 8: Component system.

Phase 9: Compiler and intermediate representation.

Phase 10: Advanced rendering and developer APIs.

Phase 11: Real-world applications.

Phase 12: Performance benchmarking and profiling.

Phase 13: Optimization and reliability.

Phase 14: Documentation and initial release.

At the end of each phase:

- Run relevant tests.
- Check TypeScript errors.
- Verify actual functionality.
- Review architecture.
- Profile performance where applicable.
- Update documentation.
- Record completed work and remaining limitations.

Do not skip phases just to reach a visually impressive result.

# 14. ANTIGRAVITY IDE WORKING INSTRUCTIONS

Before making changes:

1. Inspect the entire existing repository.
2. Identify existing code, configuration and dependencies.
3. Understand the current architecture.
4. Identify reusable files.
5. Check for existing implementation conflicts.
6. Prepare an implementation plan.

If the repository is empty, initialize it properly.

If an implementation already exists, preserve valid work and improve it rather than replacing everything unnecessarily.

Work directly inside the project.

Do not stop after creating a plan.

After planning, implement the project in manageable phases, continuing until the current milestone works.

Do not ask for confirmation for ordinary engineering decisions. Make sensible technical decisions and document them.

Do not:
- Produce pseudocode in place of working source.
- Leave core features as TODOs.
- Fake benchmark results.
- Create nonfunctional examples.
- Replace actual functionality with mock interfaces.
- Add unnecessary dependencies.
- Overengineer features before the core works.
- Claim production readiness without testing.

When encountering errors:
- Investigate the actual cause.
- Fix the root issue.
- Rerun relevant tests.
- Avoid hiding errors or weakening tests.

If the complete framework cannot be finished in one session, finish the current milestone properly and maintain a detailed DEVELOPMENT_STATUS.md containing:
- Completed modules.
- Working features.
- Test results.
- Known limitations.
- Pending tasks.
- Exact next implementation steps.

# 15. FINAL ACCEPTANCE CRITERIA

MBUF is not considered a successful initial framework until:

- Memory cells work correctly.
- Dependencies are tracked correctly.
- Updates are scheduled and deduplicated.
- DOM bindings update correctly.
- Components mount and dispose correctly.
- A real counter application works.
- A real todo application works.
- Unit and integration tests pass.
- Production builds work.
- TypeScript declarations are generated.
- Benchmark infrastructure works.
- Documentation explains the actual implementation.
- No core feature is falsely advertised.

# FINAL INSTRUCTION

Build MBUF as a technically credible, independently engineered framework.

Prioritize:

1. Architectural originality.
2. Correctness.
3. Execution efficiency.
4. Memory efficiency.
5. Developer experience.
6. Maintainability.
7. Real-world usefulness.
8. Measurable performance.

Start by inspecting the repository and writing ARCHITECTURE.md and DEVELOPMENT_STATUS.md.

Then immediately begin implementing Phase 1 and continue through the first fully working end-to-end milestone.

The result must be an actual working framework with a clear path toward a stable 1.0 release, not merely a concept or demonstration.