import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// ES 모듈에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 타입 정의
interface Product {
  title: string;
  link: string;
  image: string;
  lprice: string;
  hprice: string;
  mallName: string;
  productId: string;
  productType: string;
  brand: string;
  maker: string;
  category1: string;
  category2: string;
  category3: string;
  category4: string;
}

interface Categories {
  [key: string]: {
    [key: string]: Record<string, unknown>;
  };
}

export interface HomePageData {
  products: Product[];
  categories: Categories;
  totalCount: number;
  filters?: {
    search: string;
    category1: string;
    category2: string;
    sort: string;
    limit: number;
    page: number;
  };
}

export interface ProductDetailData {
  product: Product;
  relatedProducts: Product[];
}

// Mock 데이터 저장소
let mockProducts: Product[] = [];
let mockCategories: Categories = {};

function loadMockData() {
  if (mockProducts.length === 0) {
    try {
      // 여러 경로를 시도해서 items.json 찾기
      const possiblePaths = [
        // 현재 디렉토리 기준 (빌드된 환경)
        path.join(process.cwd(), "packages/react/src/mocks/items.json"),
        // 상위 디렉토리 기준 (빌드된 환경)
        path.join(process.cwd(), "src/mocks/items.json"),
        // __dirname 기준 (개발 환경)
        typeof __dirname !== "undefined" ? path.join(__dirname, "mocks/items.json") : null,
        typeof __dirname !== "undefined" ? path.join(__dirname, "../../src/mocks/items.json") : null,
      ].filter(Boolean);

      let itemsPath = "";
      for (const testPath of possiblePaths) {
        if (testPath && fs.existsSync(testPath)) {
          itemsPath = testPath;
          break;
        }
      }

      if (!itemsPath) {
        throw new Error("items.json not found in any of the expected locations");
      }

      const itemsData = fs.readFileSync(itemsPath, "utf-8");
      mockProducts = JSON.parse(itemsData);

      // 카테고리 구조 생성 (테스트에서 기대하는 간단한 구조로)
      mockCategories = {};
      mockProducts.forEach((product) => {
        if (!mockCategories[product.category1]) {
          mockCategories[product.category1] = {};
        }
        if (!mockCategories[product.category1][product.category2]) {
          mockCategories[product.category1][product.category2] = {};
        }
        // category3, category4는 테스트에서 기대하지 않으므로 제외
      });
    } catch (error) {
      console.error("Failed to load mock data:", error);
    }
  }
}

export async function loadHomePageData(url: string): Promise<HomePageData | null> {
  loadMockData();

  // URL 파라미터 파싱
  const urlObj = new URL(url, "http://localhost");
  const searchParams = urlObj.searchParams;

  const search = decodeURIComponent(searchParams.get("search") || "");
  const category1 = decodeURIComponent(searchParams.get("category1") || "");
  const category2 = decodeURIComponent(searchParams.get("category2") || "");
  const sort = searchParams.get("sort") || "price_asc";
  const limit = parseInt(searchParams.get("limit") || "20");
  const page = parseInt(searchParams.get("page") || "1");

  const filters = { search, category1, category2, sort, limit, page };

  // 필터링된 상품 목록
  let filteredProducts = [...mockProducts];

  // 검색어 필터링
  if (search) {
    const searchTerm = search.toLowerCase();
    filteredProducts = filteredProducts.filter(
      (product) => product.title.toLowerCase().includes(searchTerm) || product.brand.toLowerCase().includes(searchTerm),
    );
  }

  // 카테고리 필터링
  if (category1) {
    filteredProducts = filteredProducts.filter((product) => product.category1 === category1);
  }
  if (category2) {
    filteredProducts = filteredProducts.filter((product) => product.category2 === category2);
  }

  // 정렬
  if (sort === "price_desc") {
    filteredProducts.sort((a, b) => parseInt(b.lprice) - parseInt(a.lprice));
  } else if (sort === "name_asc") {
    filteredProducts.sort((a, b) => a.title.localeCompare(b.title, "ko"));
  } else if (sort === "name_desc") {
    filteredProducts.sort((a, b) => b.title.localeCompare(a.title, "ko"));
  } else {
    // 기본: 가격 낮은 순
    filteredProducts.sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
  }

  // 페이지네이션 적용
  const startIndex = (page - 1) * limit;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + limit);

  return {
    products: paginatedProducts,
    categories: mockCategories,
    totalCount: filteredProducts.length,
    filters,
  };
}

export async function loadProductDetailData(productId: string): Promise<ProductDetailData | null> {
  loadMockData();

  const product = mockProducts.find((p) => p.productId === productId);
  if (!product) {
    return null;
  }

  // 관련 상품 (같은 카테고리의 다른 상품들)
  const relatedProducts = mockProducts
    .filter((p) => p.productId !== productId && p.category1 === product.category1 && p.category2 === product.category2)
    .slice(0, 4);

  return {
    product,
    relatedProducts,
  };
}
