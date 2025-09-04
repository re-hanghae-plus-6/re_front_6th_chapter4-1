import { getCategories, getProduct, getProducts } from "../api/productApi";
import { initialProductState, type ProductStoreState } from "../entities";
import type { GlobalSnapshot } from "../global";
import type { GetServerSideProps } from "../router/types";

export const getHomePageProps: GetServerSideProps<GlobalSnapshot> = async ({ query }) => {
  try {
    const [productsData, categoriesData] = await Promise.all([getProducts(query), getCategories()]);

    const productStoreState = {
      products: productsData.products,
      categories: categoriesData,
      totalCount: productsData.pagination.total,
      loading: false,
      error: null,
      currentProduct: null,
      relatedProducts: [],
      status: "done",
    } satisfies ProductStoreState;

    return {
      props: {
        snapshots: {
          productStore: { ...initialProductState, ...productStoreState },
        },
      },
    };
  } catch (error) {
    console.error("HomePage prefetch error:", error);
    return {
      props: {
        snapshots: {
          productStore: initialProductState,
        },
      },
    };
  }
};

export const getProductDetailProps: GetServerSideProps<GlobalSnapshot> = async ({ params }) => {
  try {
    const productId = params.id;
    if (!productId) {
      throw new Error("Product ID is required");
    }

    const product = await getProduct(productId);

    const relatedCandidateResponse = await getProducts({ category2: product.category2 });
    const relatedProducts = relatedCandidateResponse.products
      .filter((p) => p.productId !== product.productId)
      .slice(0, 20);

    return {
      props: {
        snapshots: {
          productStore: {
            ...initialProductState,
            currentProduct: product,
            relatedProducts,
            loading: false,
            status: "done",
          },
        },
      },
    };
  } catch (error) {
    console.error("ProductDetailPage prefetch error:", error);
    return {
      props: {
        snapshots: {
          productStore: initialProductState,
        },
      },
    };
  }
};
