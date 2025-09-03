/**
 * API 라우터 - Express 서버에서 API 라우트를 자동화된 방식으로 관리
 */
export class ApiRouter {
  #routes;
  #basePath;

  constructor(basePath = "/api") {
    this.#routes = new Map();
    this.#basePath = basePath;
  }

  get basePath() {
    return this.#basePath;
  }

  /**
   * API 라우트 등록
   * @param {string} method - HTTP 메서드 (GET, POST, PUT, DELETE 등)
   * @param {string} path - API 경로 (예: "/products", "/products/:id")
   * @param {Function} handler - API 핸들러 함수
   */
  addRoute(method, path, handler) {
    const key = `${method.toUpperCase()}:${path}`;
    const paramNames = [];

    // 경로 패턴을 정규식으로 변환
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1)); // ':id' -> 'id'
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    const regex = new RegExp(`^${regexPath}$`);

    console.log(`API 라우트 등록: ${method.toUpperCase()} ${path} -> ${regex}`);

    this.#routes.set(key, {
      method: method.toUpperCase(),
      path,
      regex,
      paramNames,
      handler,
    });
  }

  /**
   * 라우트 매칭
   * @param {string} method - HTTP 메서드
   * @param {string} path - 요청 경로
   * @returns {Object|null} 매칭된 라우트 정보
   */
  findRoute(method, path) {
    const normalizedPath = path.replace(this.#basePath, "");

    console.log(`API 라우트 찾기: ${method.toUpperCase()} ${normalizedPath}`);
    console.log("등록된 API 라우트들:", Array.from(this.#routes.keys()));

    for (const [key, route] of this.#routes) {
      if (route.method === method.toUpperCase()) {
        const match = normalizedPath.match(route.regex);
        console.log(`라우트 ${key} 매칭 시도:`, match);
        if (match) {
          const params = {};
          route.paramNames.forEach((name, index) => {
            params[name] = match[index + 1];
          });

          console.log("매칭된 API 라우트:", key, "파라미터:", params);
          return {
            ...route,
            params,
            key,
          };
        }
      }
    }
    return null;
  }

  /**
   * Express 미들웨어로 사용할 수 있는 라우터 함수
   * @param {Object} req - Express request 객체
   * @param {Object} res - Express response 객체
   * @param {Function} next - Express next 함수
   */
  middleware(req, res, next) {
    try {
      const route = this.findRoute(req.method, req.path);

      if (!route) {
        return next();
      }

      // 라우트 파라미터를 req.params에 추가
      req.params = { ...req.params, ...route.params };

      // 핸들러 실행
      const result = route.handler(req, res);

      // Promise인 경우 처리
      if (result && typeof result.then === "function") {
        result.catch((error) => {
          console.error("API 핸들러 오류:", error);
          res.status(500).json({ error: "Internal Server Error" });
        });
      }
    } catch (error) {
      console.error("API 라우터 오류:", error);
      next(error);
    }
  }
}
