import { defineConfig } from "vite";

const base = process.env.NODE_ENV === "production" ? "/front_6th_chapter4-1/vanilla/" : "";

export default defineConfig({
  base,
  build: {
    rollupOptions: {
      input: {
        client: "./index.html",
        server: "./src/main-server.js",
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === "server" ? "server/[name].js" : "client/[name]-[hash].js";
        },
      },
    },
  },
  ssr: {
    noExternal: true,
  },
});
