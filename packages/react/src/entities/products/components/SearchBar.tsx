import { type ChangeEvent, Fragment, type KeyboardEvent, type MouseEvent, useState, useEffect } from "react";
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
  ssrQuery?: Record<string, string>;
}

export function SearchBar({ initialCategories, ssrQuery }: SearchBarProps = {}) {
  const storeState = useProductStore();
  const filterFromHook = useProductFilter();

  // SSR 쿼리가 있으면 우선 사용, 없으면 훅에서 가져온 값 사용
  const searchQuery = ssrQuery?.search || filterFromHook.searchQuery || "";
  const limit = ssrQuery?.limit || filterFromHook.limit || "20";
  const sort = ssrQuery?.sort || filterFromHook.sort || "price_asc";
  const category1 = ssrQuery?.category1 || filterFromHook.category.category1 || "";
  const category2 = ssrQuery?.category2 || filterFromHook.category.category2 || "";
  const category = { category1, category2 };

  // 클라이언트에서 검색어 입력을 위한 로컬 상태
  const [inputValue, setInputValue] = useState(searchQuery);

  // SSR 쿼리가 변경되면 입력값도 업데이트
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  // 검색 입력 (Enter 키)
  const handleSearchKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const query = inputValue.trim();
      try {
        searchProducts(query);
      } catch (error) {
        console.error("검색 실패:", error);
      }
    }
  };

  // 검색어 입력 변경 처리
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // SSR 데이터 존재 여부 확인
  const hasSSRCategories = initialCategories && Object.keys(initialCategories).length > 0;

  console.log("🔍 SearchBar 렌더링:", {
    searchQuery,
    limit,
    sort,
    category,
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
            value={inputValue}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onKeyDown={handleSearchKeyDown}
            onChange={handleSearchChange}
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
              value={limit}
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
              value={sort}
            >
              {sortOptions}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
