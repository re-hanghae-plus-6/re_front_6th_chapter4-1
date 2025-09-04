import { isServer } from "./environment";

const getBaseUrl = () => {
  return isServer() ? "http://localhost:5174" : "";
};

export const apiFetch = async (url, options = {}) => {
  const baseUrl = getBaseUrl();
  const fullUrl = url.startsWith("/") ? `${baseUrl}${url}` : url;

  return fetch(fullUrl, options);
};
