import { renderToString } from "../packages/renderer/src/ssr.ts";
import { createRouter } from "../packages/router/src/index.ts";
import { cell } from "../packages/memory/src/index.ts";
import { assert, assertEqual, test } from "./assert.ts";

export async function runSsrAndRouterTests() {
  console.log("Running SSR and Router tests...");

  await test("renderToString serializes primitives and basic structures", () => {
    const html1 = renderToString("Hello World");
    assertEqual(html1, "Hello World");

    const html2 = renderToString(12345);
    assertEqual(html2, "12345");

    const html3 = renderToString(["<div>", "safe", "</div>"]);
    assertEqual(html3, "&lt;div&gt;safe&lt;/div&gt;");
  });

  await test("router navigates and updates currentPath memory cell", () => {
    const router = createRouter({
      routes: {
        "/": () => "Home" as any,
        "/about": () => "About" as any
      }
    });

    assertEqual(router.currentPath.get(), "/");

    router.navigate("/about");
    assertEqual(router.currentPath.get(), "/about");
  });
}

