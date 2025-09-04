import { defineConfig } from "vite";
import { copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const base = process.env.NODE_ENV === "production" ? "/front_6th_chapter4-1/vanilla/" : "";

export default defineConfig({
  base,
  build: {
    rollupOptions: {
      external: (id) => {
        // MSW 관련 모듈은 외부 의존성으로 처리
        if (id.includes("msw") || id.includes("@mswjs")) {
          return true;
        }
        return false;
      },
    },
  },
  plugins: [
    {
      name: "copy-json-files",
      writeBundle() {
        try {
          // client 빌드용 (vanilla 폴더)
          mkdirSync("./dist/vanilla/src/mocks", { recursive: true });
          copyFileSync("./src/mocks/items.json", "./dist/vanilla/src/mocks/items.json");

          // server 빌드용 (vanilla-ssr 폴더)
          mkdirSync("./dist/vanilla-ssr/mocks", { recursive: true });
          copyFileSync("./src/mocks/items.json", "./dist/vanilla-ssr/mocks/items.json");

          console.log("✅ items.json 파일 복사 완료");
        } catch (error) {
          console.error("❌ items.json 파일 복사 실패:", error);
        }
      },
    },
  ],
});
