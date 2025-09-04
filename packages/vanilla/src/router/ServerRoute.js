class ServerRouter {
  constructor() {
    this.routes = [];
    this.currentUrl = ""; // 현재 URL 저장
  }

  // URL 설정 (서버에서 사용)
  setCurrentUrl(url) {
    this.currentUrl = url;
  }

  // 클라이언트 Router와 호환되는 query getter 추가
  get query() {
    if (!this.currentUrl) return {};

    try {
      const urlObj = new URL(this.currentUrl, "http://localhost");
      const query = {};
      for (const [key, value] of urlObj.searchParams) {
        query[key] = decodeURIComponent(value);
      }
      return query;
    } catch (error) {
      console.error("Error parsing query:", error);
      return {};
    }
  }

  // 미리 정의된 라우트 추가
  addRoute(path, handler) {
    // :id → ([^/]+) 정규식 변환 (클라이언트 Router와 동일하게)
    const paramNames = [];
    const regexPattern = path
      .replace(/:\w+/g, (match) => {
        const paramName = match.slice(1);
        paramNames.push(paramName);
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    const regex = new RegExp(`^${regexPattern}\\/?$`);
    console.log("ServerRouter addRoute:", path, "->", regex.source);

    this.routes.push({
      path,
      handler,
      regex,
      paramNames,
    });
  }

  // 라우트 찾기
  findRoute(url) {
    // URL 저장 (query getter에서 사용)
    this.setCurrentUrl(url);

    // URL에서 pathname과 query 분리
    const urlObj = new URL(url, "http://localhost");
    const pathname = urlObj.pathname;
    console.log("ServerRouter findRoute - Input URL:", url, "Pathname:", pathname);
    // URL 디코딩을 적용한 query 파라미터 처리
    const query = {};
    for (const [key, value] of urlObj.searchParams) {
      query[key] = decodeURIComponent(value);
    }

    for (const route of this.routes) {
      console.log("ServerRouter trying route:", route.path, "regex:", route.regex.source);
      const match = pathname.match(route.regex);
      console.log("Match result:", match);
      if (match) {
        const params = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        console.log("ServerRouter found match:", { path: route.path, params, query });
        return {
          handler: route.handler,
          params,
          query,
          path: route.path,
        };
      }
    }

    return null;
  }
}

export const serverRouter = new ServerRouter();
