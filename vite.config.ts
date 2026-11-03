import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "mbuf": resolve(__dirname, "packages/mbuf/src/index.ts"),
      "@mbuf/memory": resolve(__dirname, "packages/memory/src/index.ts"),
      "@mbuf/dependency": resolve(__dirname, "packages/dependency/src/index.ts"),
      "@mbuf/scheduler": resolve(__dirname, "packages/scheduler/src/index.ts"),
      "@mbuf/renderer": resolve(__dirname, "packages/renderer/src/index.ts"),
      "@mbuf/components": resolve(__dirname, "packages/components/src/index.ts"),
      "@mbuf/compiler": resolve(__dirname, "packages/compiler/src/index.ts"),
      "@mbuf/runtime": resolve(__dirname, "packages/runtime/src/index.ts"),
      "@mbuf/router": resolve(__dirname, "packages/router/src/index.ts"),
      "@mbuf/devtools": resolve(__dirname, "packages/devtools/src/index.ts")
    }
  },
  server: {
    port: 3000,
    open: false
  },
  build: {
    target: "es2022",
    sourcemap: true
  }
});

