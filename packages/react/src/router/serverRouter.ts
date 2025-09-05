import type { FunctionComponent } from "react";

type StringRecord = Record<string, string>;

interface RouteDef {
  regex: RegExp;
  handler: FunctionComponent;
  params: string[];
}

const routes: RouteDef[] = [];

function normalizePath(path?: string): string {
  if (!path) return "/";
  const s = String(path);
  const withLeading = s.startsWith("/") ? s : `/${s}`;
  const withoutTrailing = withLeading !== "/" ? withLeading.replace(/\/$/, "") : withLeading;
  return withoutTrailing === "" ? "/" : withoutTrailing;
}

export const route = {
  add: (pattern: string, handler: FunctionComponent) => {
    const normalizedPattern = normalizePath(pattern);

    const params = Array.from(normalizedPattern.matchAll(/:([A-Za-z0-9_]+)/g)).map(([, name]) => name);
    const regexPattern = normalizedPattern.replace(/:([A-Za-z0-9_]+)/g, "([^/]+)");

    const regex = new RegExp(`^${regexPattern}/?$`);

    routes.push({ regex, handler, params });
  },

  find: (url: string) => {
    const pathname = normalizePath(url.split("?")[0] ?? "/");

    const matched = routes
      .map((r) => {
        const match = pathname.match(r.regex);
        if (!match) return null;
        const paramsObj: StringRecord = Object.fromEntries(r.params.map((name, idx) => [name, match[idx + 1]]));
        return { handler: r.handler, params: paramsObj } as const;
      })
      .find(Boolean);

    return matched ?? null;
  },
};
