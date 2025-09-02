// 공통: 경로 패턴 → 정규식 매칭
export function createRouteMatcher(path) {
  const paramNames = [];
  const regexPath = path
    .replace(/:\w+/g, (match) => {
      paramNames.push(match.slice(1));
      return "([^/]+)";
    })
    .replace(/\//g, "\\/");

  const regex = new RegExp(`^${regexPath}$`);
  return { regex, paramNames };
}

export function parseQueryString(search = "") {
  const params = new URLSearchParams(search);
  const query = {};
  for (const [k, v] of params) query[k] = v;
  return query;
}
