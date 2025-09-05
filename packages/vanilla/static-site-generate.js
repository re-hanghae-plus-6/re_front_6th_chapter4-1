import fs from "fs";

// items.json 데이터 로드
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

// 서버사이드 렌더링 함수들 import
async function getServerRenderFunctions() {
  try {
    const ssrModulePath = `./dist/vanilla-ssr/main-server.js`;
    const { render } = await import(ssrModulePath);
    return { render };
  } catch (error) {
    console.error("Failed to import server render functions:", error);
    return { render: null };
  }
}

async function generateStaticSite() {
  console.log("🚀 Starting SSG generation...");

  // 데이터 로드
  const items = await loadItemsData();
  const categories = getUniqueCategories(items);
  const sortedProducts = filterAndSortProducts(items);

  console.log(`📦 Loaded ${items.length} products`);

  // 서버 렌더링 함수 가져오기
  const { render } = await getServerRenderFunctions();

  if (!render) {
    throw new Error("Server render function not available");
  }

  // HTML 템플릿 읽기
  const template = fs.readFileSync("../../dist/vanilla/index.html", "utf-8");

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

  fs.writeFileSync("../../dist/vanilla/index.html", homeHtml);
  console.log("✅ Homepage generated");

  // 2. 상품 상세 페이지들 생성
  console.log("📋 Generating product detail pages...");

  // product 디렉토리 생성
  const productDir = "../../dist/vanilla/product";
  if (!fs.existsSync(productDir)) {
    fs.mkdirSync(productDir, { recursive: true });
  }

  // 각 상품에 대해 상세 페이지 생성
  for (const product of items) {
    const productId = product.productId;
    const productDir = `../../dist/vanilla/product/${productId}`;

    // 상품별 디렉토리 생성
    if (!fs.existsSync(productDir)) {
      fs.mkdirSync(productDir, { recursive: true });
    }

    // 상품 상세 데이터 준비
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
    };

    const productRendered = await render(`/product/${productId}/`, {}, productInitialData, { doSSR: true });
    const productHtml = template
      .replace(`<!--app-head-->`, productRendered.head || "")
      .replace(`<!--app-html-->`, productRendered.html || "")
      .replace(
        `</head>`,
        `<script>
           window.__INITIAL_DATA__=${JSON.stringify(productInitialData).replace(/</g, "\\u003c")};
           window.__RENDER_MODE__="ssr";
         </script></head>`,
      );

    fs.writeFileSync(`${productDir}/index.html`, productHtml);

    // 진행률 출력
    if (items.indexOf(product) % 50 === 0) {
      console.log(`📋 Generated ${items.indexOf(product) + 1}/${items.length} product pages...`);
    }
  }

  console.log(`✅ Generated ${items.length} product detail pages`);
  console.log("🎉 SSG generation completed!");
}

// 실행
generateStaticSite().catch(console.error);
