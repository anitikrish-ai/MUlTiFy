import { runMemoryTests } from "./test-memory.js";
import { runReactivityTests } from "./test-reactivity.js";
import { runCompilerTests } from "./test-compiler.js";
import { runSsrAndRouterTests } from "./test-ssr-router.js";
import { runLifecycleEdgeCaseTests } from "./test-lifecycle-edgecases.js";

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

