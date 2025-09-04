import { type ChangeEvent, Fragment, type KeyboardEvent, type MouseEvent } from "react";
import { PublicImage } from "../../../components";
import { useProductStore } from "../hooks";
import { useProductFilter } from "./hooks";
import { searchProducts, setCategory, setLimit, setSort } from "../productUseCase";

const OPTION_LIMITS = [10, 20, 50, 100];
const OPTION_SORTS = [
  { value: "price_asc", label: "가격 낮은순" },
  { value: "price_desc", label: "가격 높은순" },
  { value: "name_asc", label: "이름순" },
  { value: "name_desc", label: "이름 역순" },
];

// 검색 입력 (Enter 키)
const handleSearchKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "Enter") {
    const query = e.currentTarget.value.trim();
    try {
      searchProducts(query);
    } catch (error) {
      console.error("검색 실패:", error);
    }
  }
};

// 페이지당 상품 수 변경
const handleLimitChange = async (e: ChangeEvent<HTMLSelectElement>) => {
  const limit = parseInt(e.target.value);
  try {
    setLimit(limit);
  } catch (error) {
    console.error("상품 수 변경 실패:", error);
  }
};

// 정렬 변경
const handleSortChange = async (e: ChangeEvent<HTMLSelectElement>) => {
  const sort = e.target.value;

  try {
    setSort(sort);
  } catch (error) {
    console.error("정렬 변경 실패:", error);
  }
};

// 브레드크럼 카테고리 네비게이션
const handleBreadCrumbClick = async (e: MouseEvent<HTMLButtonElement>) => {
  const breadcrumbType = e.currentTarget.getAttribute("data-breadcrumb");

  try {
    if (breadcrumbType === "reset") {
      // "전체" 클릭 -> 카테고리 초기화
      setCategory({ category1: "", category2: "" });
    } else if (breadcrumbType === "category1") {
      // 1depth 클릭 -> 2depth 제거하고 1depth만 유지
      const category1 = e.currentTarget.getAttribute("data-category1");
      setCategory({ ...(category1 && { category1 }), category2: "" });
    }
  } catch (error) {
    console.error("브레드크럼 네비게이션 실패:", error);
  }
};

// 1depth 카테고리 선택
const handleMainCategoryClick = async (e: MouseEvent<HTMLButtonElement>) => {
  const category1 = e.currentTarget.getAttribute("data-category1");
  if (!category1) return;

  try {
    setCategory({ category1, category2: "" });
  } catch (error) {
    console.error("1depth 카테고리 선택 실패:", error);
  }
};

const handleSubCategoryClick = async (e: MouseEvent<HTMLButtonElement>) => {
  const category1 = e.currentTarget.getAttribute("data-category1");
  const category2 = e.currentTarget.getAttribute("data-category2");
  if (!category1 || !category2) return;

  try {
    setCategory({ category1, category2 });
  } catch (error) {
    console.error("2depth 카테고리 선택 실패:", error);
  }
};

interface SearchBarProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialCategories?: any;
}

export function SearchBar({ initialCategories }: SearchBarProps = {}) {
  const storeState = useProductStore();
  const { searchQuery, limit = "20", sort, category } = useProductFilter();

  // SSR 데이터 존재 여부 확인
  const hasSSRCategories = initialCategories && Object.keys(initialCategories).length > 0;

  console.log("🔍 SearchBar 렌더링:", {
    hasInitialCategories: !!initialCategories,
    initialCategoriesKeys: Object.keys(initialCategories || {}).length,
    storeCategoriesKeys: Object.keys(storeState.categories || {}).length,
    hasSSRCategories,
    storeLoading: storeState.loading,
  });

  // SSR 데이터가 있으면 우선 사용, 없으면 스토어 상태 사용
  const categories = hasSSRCategories ? initialCategories : storeState.categories;
  const categoryList = Object.keys(categories).length > 0 ? Object.keys(categories) : [];

  // 🚨 카테고리 로딩 상태 확인
  const isCategoryLoading = !hasSSRCategories && categoryList.length === 0;
  if (isCategoryLoading) {
    console.log("🔄 SearchBar 카테고리 로딩 중!", {
      hasSSRCategories,
      storeLoading: storeState.loading,
      categoriesLength: categoryList.length,
    });

    // 브라우저에서만 alert 표시
    if (typeof window !== "undefined") {
      setTimeout(() => {
        alert(
          `🔄 SearchBar 카테고리 로딩 중!\nSSR 카테고리: ${hasSSRCategories ? "있음" : "없음"}\n스토어 로딩: ${storeState.loading ? "중" : "완료"}`,
        );
      }, 200);
    }
  } else {
    console.log("✅ SearchBar 카테고리 로딩 완료!", {
      hasSSRCategories,
      categoriesCount: categoryList.length,
    });
  }
  const limitOptions = OPTION_LIMITS.map((value) => (
    <option key={value} value={value}>
      {value}개
    </option>
  ));
  const sortOptions = OPTION_SORTS.map(({ value, label }) => (
    <option key={value} value={value}>
      {label}
    </option>
  ));

  const categoryButtons = categoryList.map((categoryKey) => (
    <button
      key={categoryKey}
      data-category1={categoryKey}
      className="category1-filter-btn text-left px-3 py-2 text-sm rounded-md border transition-colors
                 bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
      onClick={handleMainCategoryClick}
    >
      {categoryKey}
    </button>
  ));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      {/* 검색창 */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            id="search-input"
            placeholder="상품명을 검색해보세요..."
            defaultValue={searchQuery}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onKeyDown={handleSearchKeyDown}
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <PublicImage src="/search-icon.svg" alt="검색" className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* 필터 옵션 */}
      <div className="space-y-3">
        {/* 카테고리 필터 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">카테고리:</label>
            {["전체", category.category1, category.category2]
              .filter((cat, index) => index === 0 || Boolean(cat))
              .map((cat, index) => {
                if (index == 0) {
                  return (
                    <button
                      key="reset"
                      data-breadcrumb="reset"
                      className="text-xs hover:text-blue-800 hover:underline"
                      onClick={handleBreadCrumbClick}
                    >
                      전체
                    </button>
                  );
                }

                if (index === 1) {
                  return (
                    <Fragment key={cat}>
                      <span className="text-xs text-gray-500">&gt;</span>
                      <button
                        data-breadcrumb="category1"
                        data-category1={cat}
                        className="text-xs hover:text-blue-800 hover:underline"
                        onClick={handleBreadCrumbClick}
                      >
                        {cat}
                      </button>
                    </Fragment>
                  );
                }

                return (
                  <Fragment key={cat}>
                    <span className="text-xs text-gray-500">&gt;</span>
                    <span className="text-xs text-gray-600 cursor-default">{cat}</span>
                  </Fragment>
                );
              })}
          </div>

          {/* 1depth 카테고리 */}
          {!category.category1 && (
            <div className="flex flex-wrap gap-2">
              {categoryList.length > 0
                ? categoryButtons
                : // SSR 데이터가 있으면 로딩 메시지 표시하지 않음
                  !hasSSRCategories &&
                  (() => {
                    console.log("📂 카테고리 로딩 메시지 표시 중!");

                    // 브라우저에서만 alert 표시 (한 번만)
                    if (typeof window !== "undefined" && !window.__CATEGORY_LOADING_ALERTED__) {
                      window.__CATEGORY_LOADING_ALERTED__ = true;
                      setTimeout(() => {
                        alert("📂 카테고리 로딩 메시지 표시!\n'카테고리 로딩 중...' 텍스트가 화면에 나타났습니다!");
                      }, 250);
                    }

                    return <div className="text-sm text-gray-500 italic">카테고리 로딩 중...</div>;
                  })()}
            </div>
          )}

          {/* 2depth 카테고리 */}
          {category.category1 && categories[category.category1] && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {Object.keys(categories[category.category1]).map((category2) => {
                  const isSelected = category.category2 === category2;
                  return (
                    <button
                      key={category2}
                      data-category1={category.category1}
                      data-category2={category2}
                      className={`category2-filter-btn text-left px-3 py-2 text-sm rounded-md border transition-colors
                               ${
                                 isSelected
                                   ? "bg-blue-100 border-blue-300 text-blue-800"
                                   : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                               }`}
                      onClick={handleSubCategoryClick}
                    >
                      {category2}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 기존 필터들 */}
        <div className="flex gap-2 items-center justify-between">
          {/* 페이지당 상품 수 */}
          <div className="flex items-center gap-2">
            <label htmlFor="limit-select" className="text-sm text-gray-600">
              개수:
            </label>
            <select
              id="limit-select"
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              onChange={handleLimitChange}
              defaultValue={Number(limit)}
            >
              {limitOptions}
            </select>
          </div>

          {/* 정렬 */}
          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="text-sm text-gray-600">
              정렬:
            </label>
            <select
              id="sort-select"
              className="text-sm border border-gray-300 rounded px-2 py-1
                           focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              onChange={handleSortChange}
              defaultValue={sort}
            >
              {sortOptions}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
