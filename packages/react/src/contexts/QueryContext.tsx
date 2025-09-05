import { createContext, useContext, type ReactNode } from "react";
import type { StringRecord } from "@hanghae-plus/lib";

interface QueryContextType {
  query: StringRecord;
  updateQuery: (newQuery: StringRecord) => void;
}

export const QueryContext = createContext<QueryContextType | null>(null);

interface QueryProviderProps {
  children: ReactNode;
  initialQuery?: StringRecord;
}

export function QueryProvider({ children, initialQuery = {} }: QueryProviderProps) {
  const updateQuery = (newQuery: StringRecord) => {
    // 클라이언트에서만 URL 업데이트
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      Object.entries(newQuery).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") {
          url.searchParams.delete(key);
        } else {
          url.searchParams.set(key, String(value));
        }
      });
      window.history.pushState(null, "", url.toString());
      // 라우터에게 변경 알림
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  return <QueryContext.Provider value={{ query: initialQuery, updateQuery }}>{children}</QueryContext.Provider>;
}

export function useQueryContext() {
  const context = useContext(QueryContext);
  if (!context) {
    throw new Error("useQueryContext must be used within a QueryProvider");
  }
  return context;
}
