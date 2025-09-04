/**
 * 페이지별 SSR 메서드들 - 클라이언트 모듈 import 없이 순수하게 서버 전용
 * 바닐라 JS의 SSR 메서드들을 React용으로 포팅
 */

// 외부 타입 import 없이 인라인 타입 정의
interface SSRContext {
  params: Record<string, string>;
  query: Record<string, string>;
}

interface MetaData {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
}

// 바닐라와 동일한 방식으로 API 호출 (기존 productApi 사용)
const fetchProducts = async (params: Record<string, string> = {}) => {
  // 동적 import로 productApi 사용 (MSW가 처리)
  const { getProducts } = await import("../api/productApi");
  return getProducts(params);
};

const fetchProduct = async (id: string) => {
  const { getProduct } = await import("../api/productApi");
  return getProduct(id);
};

const fetchCategories = async () => {
  const { getCategories } = await import("../api/productApi");
  return getCategories();
};

/**
 * 홈페이지 SSR 메서드
 */
export const homePageSSR = async ({ query }: SSRContext) => {
  try {
    console.log("홈페이지 SSR 데이터 로드 시작:", query);

    // SSR에서도 클라이언트와 동일한 정렬 기준 사용
    const queryWithSort = { ...query, sort: query.sort || "price_asc" };
    const [productsResponse, categories] = await Promise.all([fetchProducts(queryWithSort), fetchCategories()]);

    console.log("홈페이지 SSR 데이터 로드 완료:", {
      productsResponse,
      categories,
      productsCount: productsResponse?.products?.length || 0,
    });

    // SSR에서는 로딩 상태 없이 완전한 데이터만 반환
    return {
      products: productsResponse?.products || [],
      categories: categories || {},
      totalCount: productsResponse?.pagination?.total || 0,
    };
  } catch (error) {
    console.error("홈페이지 SSR 데이터 로드 실패:", error);
    // 에러 발생 시에도 기본 데이터 구조 유지
    return {
      products: [],
      categories: {},
      totalCount: 0,
    };
  }
};

export const homePageMetadata = ({ query }: { query?: Record<string, string> } = {}): MetaData => {
  const searchQuery = query?.search;
  if (searchQuery) {
    return {
      title: `"${searchQuery}" 검색 결과 - 쇼핑몰`,
      description: `"${searchQuery}" 관련 상품을 찾아보세요`,
      keywords: `${searchQuery}, 쇼핑, 검색`,
    };
  }

  return {
    title: "쇼핑몰 - 홈",
    description: "다양한 상품을 만나보세요",
    keywords: "쇼핑, 온라인 쇼핑몰, 상품",
  };
};

/**
 * 상품 상세 페이지 SSR 메서드
 */
export const productDetailPageSSR = async ({ params }: SSRContext) => {
  try {
    console.log("상품 상세 페이지 SSR 시작:", params.id);

    const product = await fetchProduct(params.id);
    console.log("상품 데이터 로드 완료:", product?.title);

    if (!product) {
      throw new Error("Product not found");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let relatedProducts: any[] = [];

    // 관련 상품 로드
    if (product.category2) {
      console.log("관련 상품 로드 시작:", product.category2);
      const relatedResponse = await fetchProducts({
        category2: product.category2,
        limit: "20",
        page: "1",
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      relatedProducts = relatedResponse.products.filter((p: any) => p.productId !== params.id);
      console.log("관련 상품 로드 완료:", relatedProducts.length, "개");
    }

    // SSR에서는 로딩 상태 없이 완전한 데이터만 반환
    return {
      currentProduct: product,
      relatedProducts,
    };
  } catch (error) {
    console.error("상품 상세 페이지 SSR 실패:", error);
    // 에러 발생 시에도 기본 데이터 구조 유지
    return {
      currentProduct: null,
      relatedProducts: [],
    };
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const productDetailPageMetadata = ({ data }: { data?: { currentProduct?: any } } = {}): MetaData => {
  const product = data?.currentProduct;

  if (product) {
    return {
      title: `${product.title} - 쇼핑몰`,
      description: `${product.title} 상품 정보를 확인하세요. ${product.brand}에서 제공하는 고품질 상품입니다.`,
      keywords: `${product.title}, ${product.brand}, 쇼핑, ${product.category1}, ${product.category2}`,
      image: product.image,
    };
  }

  return {
    title: "상품 상세 - 쇼핑몰",
    description: "상품 정보를 확인하세요",
    keywords: "상품, 상세, 쇼핑몰",
  };
};

/**
 * 404 페이지 SSR 메서드
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const notFoundPageSSR = async (): Promise<any> => {
  // 정적 페이지이므로 빈 객체 반환
  return {};
};

export const notFoundPageMetadata = (): MetaData => {
  return {
    title: "404 - 페이지를 찾을 수 없습니다",
    description: "요청하신 페이지를 찾을 수 없습니다",
    keywords: "404, 페이지 없음",
  };
};
