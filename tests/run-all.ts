import { runMemoryTests } from "./test-memory.ts";
import { runReactivityTests } from "./test-reactivity.ts";
import { runCompilerTests } from "./test-compiler.ts";
import { runSsrAndRouterTests } from "./test-ssr-router.ts";
import { runLifecycleEdgeCaseTests } from "./test-lifecycle-edgecases.ts";

async function main() {
  console.log("=== MBUF Test Suite ===");
  try {
    await runMemoryTests();
    await runReactivityTests();
    await runCompilerTests();
    await runSsrAndRouterTests();
    await runLifecycleEdgeCaseTests();
    console.log("\nAll tests passed successfully! ✓");
  } catch (err) {
    console.error("\nTest suite failed! ✗");
    process.exit(1);
  }
}

main();

