import React, { createContext, useContext } from "react";

interface ServerRouterContextType {
  query: Record<string, string>;
  pathname: string;
}

const ServerRouterContext = createContext<ServerRouterContextType>({
  query: {},
  pathname: "/",
});

export const ServerRouterProvider: React.FC<{
  children: React.ReactNode;
  query: Record<string, string>;
  pathname: string;
}> = ({ children, query, pathname }) => {
  return <ServerRouterContext.Provider value={{ query, pathname }}>{children}</ServerRouterContext.Provider>;
};

export const useServerRouter = () => {
  const context = useContext(ServerRouterContext);
  return context;
};
