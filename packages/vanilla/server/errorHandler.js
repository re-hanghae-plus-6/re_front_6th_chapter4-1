/**
 * 에러 처리 미들웨어
 */
export const errorHandler = (err, req, res, next) => {
  console.error("Server Error:", err.stack);

  // 이미 응답이 전송된 경우
  if (res.headersSent) {
    return next(err);
  }

  // 에러 상태 코드 설정
  const status = err.status || err.statusCode || 500;

  // 프로덕션 환경에서는 상세 에러 정보 숨김
  const message = process.env.NODE_ENV === "production" ? "서버 오류가 발생했습니다." : err.message;

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

/**
 * 404 에러 처리 미들웨어
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: "요청한 리소스를 찾을 수 없습니다.",
    path: req.path,
  });
};

/**
 * 비동기 에러 래퍼
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
