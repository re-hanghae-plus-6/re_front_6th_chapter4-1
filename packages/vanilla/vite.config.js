import { defineConfig as defineTestConfig, mergeConfig } from "vitest/config";
import { defineConfig } from "vite";

const base = process.env.NODE_ENV === "production" ? "/front_6th_chapter4-1/vanilla/" : "";

export default mergeConfig(
  defineConfig({
    base,
    build: {
      outDir: "../../dist/vanilla",
      rollupOptions: {
        input: {
          main: "./index.html",
          server: "./src/main-server.js",
        },
        output: {
          entryFileNames: (chunkInfo) => {
            return chunkInfo.name === "server" ? "../vanilla-ssr/[name].js" : "assets/[name]-[hash].js";
          },
        },
      },
    },
    ssr: {
      noExternal: ["express"],
    },
  }),
  defineTestConfig({
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/setupTests.js",
      exclude: ["**/e2e/**", "**/*.e2e.spec.js", "**/node_modules/**"],
      poolOptions: {
        threads: {
          singleThread: true,
        },
      },
    },
  }),
);
