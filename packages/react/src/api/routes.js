import express from "express";

export function createApiRouter() {
  const router = express.Router();

  // 기본 API 응답 (MSW가 대부분 처리하므로 간단하게)
  router.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // MSW가 처리하지 못한 요청들에 대한 기본 응답
  router.use("*", (req, res) => {
    res.status(404).json({
      error: "API endpoint not found",
      path: req.originalUrl,
      message: "This endpoint is handled by MSW in development",
    });
  });

  return router;
}
