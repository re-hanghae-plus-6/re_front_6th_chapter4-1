import react from "@vitejs/plugin-react";
import { createViteConfig } from "../../createViteConfig";

// 환경에 따른 base URL 설정
// - 개발 서버(5175, 5176): 빈 문자열 (상대 경로)
// - 프리뷰 서버(4175, 4176, 4179): /front_6th_chapter4-1/react/ (절대 경로)
const isPreviewMode = process.env.NODE_ENV === "production" || process.env.VITE_PREVIEW_MODE === "true";
const base: string = isPreviewMode ? "/front_6th_chapter4-1/react/" : "";

export default createViteConfig({
  base,
  plugins: [react()],
});
