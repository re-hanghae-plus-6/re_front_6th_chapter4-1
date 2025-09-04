// server-router.ts
import type { AnyFunction, StringRecord } from "./types";

interface Route<Handler extends AnyFunction> {
  regex: RegExp;
  paramNames: string[];
  handler: Handler;
}

export class MemoryRouter<Handler extends AnyFunction> {
  private routes: Map<string, Route<Handler>> = new Map();

  addRoute(path: string, handler: Handler) {
    const paramNames: string[] = [];

    let regex: RegExp;

    if (path === "*" || path === ".*") {
      regex = /.*/; // 모든 경로 매칭
    } else {
      const regexPath = path
        .replace(/:\w+/g, (match) => {
          paramNames.push(match.slice(1));
          return "([^/]+)";
        })
        .replace(/\//g, "\\/");

      regex = new RegExp(`^${regexPath}$`);
    }

    this.routes.set(path, { regex, paramNames, handler });
  }

  match(url: string) {
    console.log("👉 MemoryRouter match", url);
    for (const [routePath, route] of this.routes) {
      const match = url.match(route.regex);
      if (match) {
        const params: StringRecord = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });
        return { path: routePath, component: route.handler, params };
      }
    }
    return null;
  }
}
