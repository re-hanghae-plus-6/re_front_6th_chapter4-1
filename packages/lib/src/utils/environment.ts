export const isServer = () => typeof window === "undefined";

export const isClient = () => !isServer();

export const isBrowser = () => isClient() && typeof document !== "undefined";
