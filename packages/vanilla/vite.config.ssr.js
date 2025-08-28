import { defineConfig } from "vite";

export default defineConfig({
  build: {
    ssr: true,
    outDir: "./dist/vanilla-ssr",
    rollupOptions: {
      input: "./src/main-server.js",
      output: {
        entryFileNames: "main-server.js", // 고정된 파일명
        format: "es",
      },
    },
    target: "node14",
  },
  ssr: {
    noExternal: true, // 모든 의존성을 번들에 포함
  },
});
