const BASE_PATH = "/front_6th_chapter4-1/vanilla";

export const loadInitialData = async (pathname) => {
  console.log("loadingInitialData의 pathname", pathname);
  try {
    let jsonPath;

    // basePath 제거
    const relativePath = pathname.replace(BASE_PATH, "") || "/";

    if (relativePath === "/" || relativePath === "") {
      // 홈
      console.log("👉 홈 JSON 찾기", relativePath);
      jsonPath = `${window.location.origin}${BASE_PATH}/index.json`;
    } else if (relativePath.startsWith("/product/")) {
      // 상세
      const segments = relativePath.split("/").filter(Boolean); // ["product", "85067212996"]
      const productId = segments[1];
      console.log("👉 상세페이지 JSON 찾기", productId);
      jsonPath = `${window.location.origin}${BASE_PATH}/product/${productId}.json`;
    }

    if (jsonPath) {
      console.log("👉 JSON fetch 시도", jsonPath);
      const res = await fetch(jsonPath, { cache: "force-cache" });
      if (res.ok) {
        const data = await res.json();
        console.log("👉 Loaded static JSON data:", data);
        return data;
      }
    }
  } catch (e) {
    console.warn("👉 Static JSON not found, falling back to API:", e);
  }

  return null; // JSON 없으면 API fallback
};
