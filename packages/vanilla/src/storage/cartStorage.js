import { createServerStorage, createStorage } from "../lib";

export const cartStorage = createStorage(
  "shopping_cart",
  typeof window === "undefined"
    ? createServerStorage() // 서버 메모리에 임시 저장
    : window.localStorage, // 클라이언트 로컬스토리지에 영구 저장
);
