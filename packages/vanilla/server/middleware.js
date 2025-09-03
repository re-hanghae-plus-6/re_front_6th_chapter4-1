import express from "express";

/**
 * Express 미들웨어 설정
 */
export const setupMiddleware = async (app, config) => {
  // 기본 미들웨어
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  let vite;

  // 개발 환경에서만 Vite 미들웨어 사용
  if (config.enableVite) {
    vite = await setupViteMiddleware(app, config);
  } else {
    await setupProductionMiddleware(app, config);
  }

  // MSW 서버 설정 (개발 환경에서만)
  if (config.enableMSW) {
    await setupMSWServer();
  }

  return vite;
};

/**
 * Vite 개발 미들웨어 설정
 */
const setupViteMiddleware = async (app, config) => {
  const { createServer } = await import("vite");
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    base: config.base,
  });

  app.use(vite.middlewares);
  return vite;
};

/**
 * 프로덕션 미들웨어 설정
 */
const setupProductionMiddleware = async (app, config) => {
  const compression = (await import("compression")).default;
  const sirv = (await import("sirv")).default;

  app.use(compression());
  app.use(config.base, sirv("./dist/client", { extensions: [] }));
};

/**
 * MSW 서버 설정
 */
const setupMSWServer = async () => {
  try {
    const { server } = await import("../src/mocks/server-browser.js");
    server.listen();
    console.log("✅ MSW 서버가 시작되었습니다.");
  } catch (error) {
    console.warn("⚠️ MSW 서버 시작 실패:", error.message);
    console.log("💡 MSW 없이 서버를 계속 실행합니다.");
  }
};
