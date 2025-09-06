import fs from "fs";
import { HomePage, NotFoundPage } from "../pages";
import items from "../mocks/items.json";

// SSG용 목업 데이터 생성
function createMockData() {
  // 카테고리 추출
  const categories = {};
  items.forEach((item) => {
    const cat1 = item.category1;
    const cat2 = item.category2;
    if (!categories[cat1]) categories[cat1] = {};
    if (cat2 && !categories[cat1][cat2]) categories[cat1][cat2] = {};
  });

  // 가격 낮은순으로 정렬 후 첫 20개 상품 사용
  const sortedItems = [...items].sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
  const products = sortedItems.slice(0, 20);

  return {
    products,
    categories,
    totalCount: items.length,
  };
}

// 스토어 상태 설정 (SSG용)
async function setupStoreForSSG(data) {
  const { productStore, PRODUCT_ACTIONS } = await import("../stores");

  productStore.dispatch({
    type: PRODUCT_ACTIONS.SETUP,
    payload: {
      products: data.products,
      categories: data.categories,
      totalCount: data.totalCount,
      loading: false,
      status: "done",
      error: null,
    },
  });
}

async function generateStaticSite() {
  try {
    console.log("정적 사이트 생성 시작...");

    // HTML 템플릿 읽기
    const template = fs.readFileSync("../../dist/vanilla/index.html", "utf-8");

    // 목업 데이터 생성
    const mockData = createMockData();

    // 스토어 상태 설정
    await setupStoreForSSG(mockData);

    // 홈 페이지 렌더링
    const homeHtml = HomePage();

    // 홈페이지 HTML 생성
    const homeResult = template
      .replace("<!--app-html-->", homeHtml)
      .replace("<!--app-head-->", "<title>쇼핑몰 - 홈</title>")
      .replace(
        "</body>",
        `
        <script>
          window.__INITIAL_DATA__ = ${JSON.stringify(mockData)};
        </script>
        </body>
      `,
      );

    fs.writeFileSync("../../dist/vanilla/index.html", homeResult);

    // 404 페이지 생성
    const notFoundHtml = NotFoundPage();

    const notFoundResult = template
      .replace("<!--app-html-->", notFoundHtml)
      .replace("<!--app-head-->", "<title>404 - 페이지를 찾을 수 없습니다</title>")
      .replace(
        "</body>",
        `
        <script>
          window.__INITIAL_DATA__ = ${JSON.stringify({ products: [], totalCount: 0, categories: {} })};
        </script>
        </body>
      `,
      );

    fs.writeFileSync("../../dist/vanilla/404.html", notFoundResult);

    // 주요 상품 상세 페이지 생성 (테스트에서 사용하는 상품들)
    const testProductIds = ["85067212996", "86940857379"]; // 테스트에서 사용하는 상품 ID들

    for (const productId of testProductIds) {
      try {
        // 상품 찾기
        const product = items.find((item) => item.productId === productId);
        if (!product) continue;

        // 상세 정보에 추가 데이터 포함
        const detailProduct = {
          ...product,
          description: `${product.title}에 대한 상세 설명입니다. ${product.brand} 브랜드의 우수한 품질을 자랑하는 상품으로, 고객 만족도가 높은 제품입니다.`,
          rating: 4,
          reviewCount: 150,
          stock: 50,
          images: [product.image, product.image.replace(".jpg", "_2.jpg"), product.image.replace(".jpg", "_3.jpg")],
        };

        // 관련 상품 찾기
        let relatedProducts = [];
        if (product.category2) {
          relatedProducts = items
            .filter((item) => item.category2 === product.category2 && item.productId !== productId)
            .slice(0, 20);
        }

        // 상품 상세 페이지용 데이터
        const productDetailData = {
          product: detailProduct,
          relatedProducts,
        };

        // 상품 상세 페이지 렌더링
        const { ProductDetailPage } = await import("../pages");

        // 상품 상세 페이지용 스토어 설정
        const { productStore, PRODUCT_ACTIONS, initialProductState } = await import("../stores");
        productStore.dispatch({
          type: PRODUCT_ACTIONS.SETUP,
          payload: {
            ...initialProductState,
            currentProduct: detailProduct,
            relatedProducts,
            loading: false,
            status: "done",
          },
        });

        const productDetailHtml = ProductDetailPage();
        const productTitle = product.title;

        const productDetailResult = template
          .replace("<!--app-html-->", productDetailHtml)
          .replace("<!--app-head-->", `<title>${productTitle} - 쇼핑몰</title>`)
          .replace(
            "</body>",
            `
            <script>
              window.__INITIAL_DATA__ = ${JSON.stringify(productDetailData)};
            </script>
            </body>
          `,
          );

        // 디렉토리 생성
        if (!fs.existsSync(`../../dist/vanilla/product`)) {
          fs.mkdirSync(`../../dist/vanilla/product`, { recursive: true });
        }
        if (!fs.existsSync(`../../dist/vanilla/product/${productId}`)) {
          fs.mkdirSync(`../../dist/vanilla/product/${productId}`, { recursive: true });
        }

        fs.writeFileSync(`../../dist/vanilla/product/${productId}/index.html`, productDetailResult);
        console.log(`상품 상세 페이지 생성 완료: ${productId}`);
      } catch (error) {
        console.warn(`상품 ${productId} 상세 페이지 생성 실패:`, error);
      }
    }

    console.log("정적 사이트 생성 완료");
  } catch (error) {
    console.error("정적 사이트 생성 실패:", error);
    process.exit(1);
  }
}

// 실행
generateStaticSite();
