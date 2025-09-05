export const getBaseUrl = (isProd) => {
  // Node 환경 (process.env 있음)
  const nodeEnv = typeof process !== "undefined" ? process.env : {};

  // Browser 환경 (import.meta.env 있음)
  const browserEnv = typeof import.meta !== "undefined" ? import.meta.env : {};

  if (typeof window !== "undefined") {
    // 브라우저 환경
    if (isProd) {
      // gh-pages 같은 정적 배포
      return browserEnv.VITE_BASE || "/front_6th_chapter4-1/vanilla/";
    } else {
      // 개발 환경 → origin만 사용

      return window.location.origin + "/";
    }
  }

  // Node 환경 (서버에서 실행될 때)
  const port = nodeEnv.PORT || 5173;
  return nodeEnv.BASE || (isProd ? "/front_6th_chapter4-1/vanilla/" : `http://localhost:${port}/`);
};
