import fs from "fs";
import path from "path";

// items.json 데이터 로드 (React 버전에 맞게 수정)
async function loadItemsData() {
  try {
    const itemsModule = await import("./src/mocks/items.json", { with: { type: "json" } });
    return itemsModule.default;
  } catch (error) {
    console.error("Failed to load items.json:", error);
    return [];
  }
}

// 카테고리 추출
function getUniqueCategories(itemsList) {
  const categories = {};
  itemsList.forEach((item) => {
    const cat1 = item.category1;
    const cat2 = item.category2;
    if (!categories[cat1]) categories[cat1] = {};
    if (cat2 && !categories[cat1][cat2]) categories[cat1][cat2] = {};
  });
  return categories;
}

// 상품 필터링 및 정렬
function filterAndSortProducts(products) {
  return [...products].sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
}

// 관련 상품 찾기
function getRelatedProducts(items, product, limit = 20) {
  if (!product.category2) return [];

  return items
    .filter((item) => item.category2 === product.category2 && item.productId !== product.productId)
    .slice(0, limit);
}

// React 서버사이드 렌더링 함수들 import
async function getReactRenderFunctions() {
  try {
    // React SSR 빌드된 파일에서 렌더링 함수 가져오기
    const ssrModulePath = `./dist/react-ssr/main-server.js`;
    const { render } = await import(ssrModulePath);
    return { render };
  } catch (error) {
    console.error("Failed to import React server render functions:", error);

    // 대안: 직접 React 렌더링 함수 생성
    try {
      const { renderToString } = await import("react-dom/server");
      const { createElement } = await import("react");
      const { ProductProvider } = await import("./src/entities/products/productStore.js");

      const simpleRender = (url, params, initialData, options) => {
        try {
          // 간단한 렌더링 로직 (App 컴포넌트 없이)
          const html = renderToString(
            createElement(
              ProductProvider,
              { initialData },
              createElement("div", { id: "root" }, "<!-- React content will be hydrated here -->"),
            ),
          );

          return {
            html,
            head: `<title>${initialData.currentProduct ? `${initialData.currentProduct.title} - 쇼핑몰` : "쇼핑몰 - 홈"}</title>`,
          };
        } catch (renderError) {
          console.error("Render error:", renderError);
          return {
            html: '<div id="root"><!-- Render error --></div>',
            head: "<title>쇼핑몰</title>",
          };
        }
      };

      return { render: simpleRender };
    } catch (fallbackError) {
      console.error("Fallback render creation failed:", fallbackError);
      return { render: null };
    }
  }
}

async function generateStaticSite() {
  console.log("🚀 Starting React SSG generation...");

  // 데이터 로드
  const items = await loadItemsData();
  const categories = getUniqueCategories(items);
  const sortedProducts = filterAndSortProducts(items);

  console.log(`📦 Loaded ${items.length} products`);

  // React 서버 렌더링 함수 가져오기
  const { render } = await getReactRenderFunctions();

  if (!render) {
    throw new Error("React server render function not available");
  }

  // HTML 템플릿 읽기
  const templatePath = path.resolve("../../dist/react/index.html");
  const template = fs.readFileSync(templatePath, "utf-8");

  // 1. 홈페이지 생성
  console.log("🏠 Generating homepage...");
  const homeInitialData = {
    products: sortedProducts.slice(0, 20), // 첫 20개 상품
    categories,
    totalCount: items.length,
    loading: false,
    error: null,
    currentProduct: null,
    relatedProducts: [],
    filters: { limit: "20", sort: "price_asc" },
  };

  const homeRendered = await render("/", {}, homeInitialData, { doSSR: true });
  const homeHtml = template
    .replace(`<!--app-head-->`, homeRendered.head || "")
    .replace(`<!--app-html-->`, homeRendered.html || "")
    .replace(
      `</head>`,
      `<script>
         window.__INITIAL_DATA__=${JSON.stringify(homeInitialData).replace(/</g, "\\u003c")};
         window.__RENDER_MODE__="ssr";
       </script></head>`,
    );

  fs.writeFileSync("../../dist/react/index.html", homeHtml);
  console.log("✅ Homepage generated");

  // 2. 상품 상세 페이지들 생성
  console.log("📋 Generating product detail pages...");

  // product 디렉토리 생성
  const productBaseDir = "../../dist/react/product";
  if (!fs.existsSync(productBaseDir)) {
    fs.mkdirSync(productBaseDir, { recursive: true });
  }

  // 각 상품에 대해 상세 페이지 생성
  for (let i = 0; i < items.length; i++) {
    const product = items[i];
    const productId = product.productId;
    const productDir = `../../dist/react/product/${productId}`;

    // 상품별 디렉토리 생성
    if (!fs.existsSync(productDir)) {
      fs.mkdirSync(productDir, { recursive: true });
    }

    // 상품 상세 데이터 준비 (vanilla 버전과 동일)
    const enhancedProduct = {
      ...product,
      description: `${product.title}에 대한 상세 설명입니다. ${product.brand} 브랜드의 우수한 품질을 자랑하는 상품으로, 고객 만족도가 높은 제품입니다.`,
      rating: Math.floor(Math.random() * 2) + 4,
      reviewCount: Math.floor(Math.random() * 1000) + 50,
      stock: Math.floor(Math.random() * 100) + 10,
      images: [product.image, product.image.replace(".jpg", "_2.jpg"), product.image.replace(".jpg", "_3.jpg")],
    };

    const relatedProducts = getRelatedProducts(items, product);

    const productInitialData = {
      products: [],
      categories,
      totalCount: 0,
      loading: false,
      error: null,
      currentProduct: enhancedProduct,
      relatedProducts,
      filters: {},
    };

    const productRendered = await render(`/product/${productId}/`, {}, productInitialData, { doSSR: true });
    const productHtml = template
      .replace(`<!--app-head-->`, productRendered.head || "")
      .replace(`<!--app-html-->`, productRendered.html || "")
      .replace(/<title>.*?<\/title>/, `<title>${enhancedProduct.title} - 쇼핑몰</title>`)
      .replace(
        `</head>`,
        `<script>
           window.__INITIAL_DATA__=${JSON.stringify(productInitialData).replace(/</g, "\\u003c")};
           window.__RENDER_MODE__="ssr";
         </script></head>`,
      );

    fs.writeFileSync(`${productDir}/index.html`, productHtml);

    // 진행률 출력 (50개마다)
    if (i % 50 === 0) {
      console.log(`📋 Generated ${i + 1}/${items.length} product pages...`);
    }
  }

  console.log(`✅ Generated ${items.length} product detail pages`);
  console.log("🎉 React SSG generation completed!");
}

// 디버깅용 함수 (기존 코드에서 가져옴)
function debugStaticGeneration() {
  console.log("=== React 정적 사이트 생성기 디버깅 정보 ===");
  console.log("현재 작업 디렉토리:", process.cwd());
  console.log("Node.js 버전:", process.version);
}

// 실행
if (import.meta.url === new URL(import.meta.url).href) {
  debugStaticGeneration();
  generateStaticSite().catch(console.error);
}

export { generateStaticSite, debugStaticGeneration };
