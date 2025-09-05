export class ServerRouter {
  #routes = new Map();
  #base = "";
  #last = null;

  constructor(baseUrl = "") {
    // 끝에 슬래시는 제거하되 루트('/')는 허용
    this.#base = baseUrl.replace(/\/$/, "");
  }

  // 경로 등록
  addRoute(path, handler) {
    const names = [];
    // :id 같은 세그먼트를 캡처 그룹으로 치환
    const tokenized = path.replace(/:\w+/g, (seg) => {
      names.push(seg.slice(1));
      return "([^/]+)";
    });

    // 슬래시 이스케이프 후 정규식 생성
    const source = `^${this.#base}${tokenized.replace(/\//g, "\\/")}$`;
    const regex = new RegExp(source);

    this.#routes.set(path, { regex, names, handler });
  }

  // URL 매칭
  match(url) {
    const { pathname, search } = new URL(url, "http://localhost");

    for (const [originalPath, route] of this.#routes) {
      const hit = pathname.match(route.regex);
      if (!hit) continue;

      const params = {};
      route.names.forEach((k, i) => (params[k] = hit[i + 1]));

      const found = {
        handler: route.handler,
        regex: route.regex,
        paramNames: route.names,
        params,
        path: originalPath,
        query: ServerRouter.parseQuery(search),
      };

      this.#last = found;
      return found;
    }

    this.#last = null;
    return null;
  }

  // 마지막 매치 정보 접근자
  get params() {
    return this.#last?.params ?? {};
  }
  get query() {
    return this.#last?.query ?? {};
  }
  get path() {
    return this.#last?.path ?? "";
  }
  get target() {
    return this.#last?.handler;
  }

  // 쿼리 파서
  static parseQuery(search = "") {
    const qs = new URLSearchParams(search);
    return Array.from(qs.entries()).reduce((acc, [k, v]) => {
      acc[k] = v;
      return acc;
    }, {});
  }
}
