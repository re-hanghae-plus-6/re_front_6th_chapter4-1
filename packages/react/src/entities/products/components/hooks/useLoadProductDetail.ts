import { useEffect } from "react";
import { loadProductDetailForPage } from "../../productUseCase";
import { BASE_URL } from "../../../../constants";

export const useLoadProductDetail = () => {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const rawPath = window.location.pathname;
    const base = BASE_URL.replace(/\/$/, "");
    const normalizedPath = base && rawPath.startsWith(base) ? rawPath.slice(base.length) || "/" : rawPath;
    const match = normalizedPath.match(/^\/product\/(\d+)(?:\/?|\?|$)/);
    const productId = match ? match[1] : undefined;
    if (productId) {
      loadProductDetailForPage(productId);
    }
  }, []);
};
