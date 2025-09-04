const routes = [];

function normalizePath(path) {
  if (!path) return "/";
  const s = String(path);
  const withLeading = s.startsWith("/") ? s : `/${s}`;
  const withoutTrailing = withLeading !== "/" ? withLeading.replace(/\/$/, "") : withLeading;
  return withoutTrailing === "" ? "/" : withoutTrailing;
}

export const route = {
  add: (pattern, handler) => {
    const normalizedPattern = normalizePath(pattern);

    const params = Array.from(normalizedPattern.matchAll(/:([A-Za-z0-9_]+)/g)).map(([, name]) => name);
    const regexPattern = normalizedPattern.replace(/:([A-Za-z0-9_]+)/g, (_, name) =>
      name === "id" ? "(\\d+)" : "([^/]+)",
    );

    const regex = new RegExp(`^${regexPattern}/?$`);

    routes.push({ regex, handler, params });
  },

  find: (url) => {
    const pathname = normalizePath(url.split("?")[0] ?? "/");

    const matched = routes
      .map((route) => {
        const match = pathname.match(route.regex);
        if (!match) return null;
        const params = Object.fromEntries(route.params.map((name, index) => [name, match[index + 1]]));
        return { handler: route.handler, params };
      })
      .find(Boolean);

    return matched ?? null;
  },
};
