import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ES 모듈에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 경로 설정
const projectRoot = path.resolve(__dirname, "../..");
const distDir = path.join(projectRoot, "dist/vanilla");

/**
 * 정적 사이트 생성 메인 함수
 */
async function generateStaticSite() {
  console.log("🚀 정적 사이트 생성을 시작합니다...");

  try {
    // 1. 기존 파일 검증
    await validateExistingFiles();

    // 2. 상품 데이터 로드
    const items = await loadProductData();
    console.log(`📦 ${items.length}개의 상품을 발견했습니다.`);

    // 3. 추가 정적 페이지 생성
    await generateCategoryPages(items);
    await generateSitemap(items);

    // 4. SEO 최적화
    await optimizeSEO();

    console.log("✅ 정적 사이트 생성이 완료되었습니다!");
  } catch (error) {
    console.error("❌ 정적 사이트 생성 중 오류 발생:", error);
    process.exit(1);
  }
}

/**
 * 기존 생성된 파일들 검증
 */
async function validateExistingFiles() {
  console.log("🔍 기존 파일들을 검증합니다...");

  const requiredFiles = [path.join(distDir, "index.html"), path.join(distDir, "product")];

  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`필수 파일이 없습니다: ${file}`);
    }
  }

  console.log("✅ 기존 파일 검증 완료");
}

/**
 * 상품 데이터 로드
 */
async function loadProductData() {
  const itemsPath = path.join(__dirname, "src/mocks/items.json");
  const itemsData = fs.readFileSync(itemsPath, "utf-8");
  return JSON.parse(itemsData);
}

/**
 * 카테고리별 페이지 생성
 */
async function generateCategoryPages(items) {
  console.log("📂 카테고리별 페이지 생성 중...");

  const categories = {};

  // 카테고리별 상품 그룹화
  items.forEach((item) => {
    const cat1 = item.category1;
    if (!categories[cat1]) {
      categories[cat1] = [];
    }
    categories[cat1].push(item);
  });

  // 각 카테고리별 HTML 파일 생성
  const categoriesDir = path.join(distDir, "categories");
  if (!fs.existsSync(categoriesDir)) {
    fs.mkdirSync(categoriesDir, { recursive: true });
  }

  for (const [categoryName, products] of Object.entries(categories)) {
    const categorySlug = categoryName.replace(/\//g, "-").toLowerCase();
    const fileName = `${categorySlug}.html`;
    const filePath = path.join(categoriesDir, fileName);

    // 간단한 카테고리 페이지 HTML 생성
    const html = generateCategoryHtml(categoryName, products);
    fs.writeFileSync(filePath, html);
  }

  console.log(`✅ ${Object.keys(categories).length}개의 카테고리 페이지 생성 완료`);
}

/**
 * 사이트맵 생성
 */
async function generateSitemap(items) {
  console.log("🗺️  사이트맵 생성 중...");

  const baseUrl = "https://your-domain.com"; // 실제 도메인으로 변경 필요
  const urls = [{ url: "/", priority: "1.0", changefreq: "daily" }];

  // 상품 페이지들 추가
  items.forEach((item) => {
    urls.push({
      url: `/product/${item.productId}`,
      priority: "0.8",
      changefreq: "weekly",
    });
  });

  // 카테고리 페이지들 추가
  const uniqueCategories = [...new Set(items.map((item) => item.category1))];
  uniqueCategories.forEach((category) => {
    const categorySlug = category.replace(/\//g, "-").toLowerCase();
    urls.push({
      url: `/categories/${categorySlug}`,
      priority: "0.7",
      changefreq: "weekly",
    });
  });

  // 사이트맵 XML 생성
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${baseUrl}${url.url}</loc>
    <priority>${url.priority}</priority>
    <changefreq>${url.changefreq}</changefreq>
  </url>`,
  )
  .join("\n")}
</urlset>`;

  const sitemapPath = path.join(distDir, "sitemap.xml");
  fs.writeFileSync(sitemapPath, sitemapXml);

  console.log("✅ 사이트맵 생성 완료");
}

/**
 * SEO 최적화
 */
async function optimizeSEO() {
  console.log("🔍 SEO 최적화 중...");

  // robots.txt 생성
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: https://your-domain.com/sitemap.xml`;

  fs.writeFileSync(path.join(distDir, "robots.txt"), robotsTxt);

  console.log("✅ SEO 최적화 완료");
}

/**
 * 카테고리 페이지 HTML 생성
 */
function generateCategoryHtml(categoryName, products) {
  const productList = products
    .slice(0, 20)
    .map(
      (product) => `
    <div class="product-item p-4 border rounded-lg">
      <img src="${product.image}" alt="${product.title}" class="w-full h-48 object-cover mb-2">
      <h3 class="font-semibold text-sm">${product.title}</h3>
      <p class="text-blue-600 font-bold">${product.lprice}원</p>
      <a href="/product/${product.productId}.html" class="text-blue-500 hover:underline">자세히 보기</a>
    </div>
  `,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${categoryName} - 쇼핑몰</title>
    <meta name="description" content="${categoryName} 카테고리의 상품들을 만나보세요">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
    <div class="max-w-6xl mx-auto p-4">
        <header class="mb-8">
            <h1 class="text-2xl font-bold mb-4">${categoryName}</h1>
            <a href="/" class="text-blue-500 hover:underline">← 홈으로 돌아가기</a>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            ${productList}
        </div>

        ${products.length > 20 ? `<p class="text-center mt-8 text-gray-600">그 외 ${products.length - 20}개의 상품이 더 있습니다.</p>` : ""}
    </div>
</body>
</html>`;
}

// 실행
generateStaticSite().catch(console.error);
