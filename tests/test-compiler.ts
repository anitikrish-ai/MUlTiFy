import { compile, Lexer, Parser } from "../packages/compiler/src/index.js";
import { assert, assertEqual, test } from "./assert.js";

export async function runCompilerTests() {
  console.log("Running Compiler tests...");

  await test("tokenizes, parses and compiles counter .mbuf DSL", () => {
    const dsl = `
app CounterApp {
    memory count = 0

    element h1 {
        text: "Value: {count}"
    }

    element button {
        text: "Increment"
        onClick {
            count = count + 1
        }
    }
}
    `.trim();

    const result = compile(dsl);
    assert(result.ast.type === "App");
    assertEqual(result.ast.name, "CounterApp");
    assertEqual(result.ast.state.length, 1);
    assertEqual(result.ast.state[0].name, "count");
    assertEqual(result.ast.state[0].initialValue, 0);
    assertEqual(result.ast.elements.length, 2);

    assert(result.code.includes("export const CounterApp = createComponent"));
    assert(result.code.includes("const count = memory.cell(0);"));
    assert(result.code.includes("ui.text(() => `Value: ${count.get()}`)"));
    assert(result.code.includes("count.set(count.get() + 1);"));
  });
}

