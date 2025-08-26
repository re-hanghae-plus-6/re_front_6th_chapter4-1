import react from "@vitejs/plugin-react";
import { createViteConfig } from "../../createViteConfig";

const base: string = process.env.NODE_ENV === "production" ? "/front_6th_chapter4-1/react/" : "";

const isSSR = process.env.BUILD_SSR === "true";

export default createViteConfig({
  base,
  plugins: [react()],
  build: {
    outDir: isSSR ? "../../dist/react-ssr" : "../../dist/react",
    ...(isSSR && {
      ssr: true,
      rollupOptions: {
        input: "./src/main-server.tsx",
        output: {
          format: "es",
        },
      },
    }),
  },
});
