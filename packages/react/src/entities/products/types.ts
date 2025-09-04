import type { StringRecord } from "../../types";

export type Categories = Record<string, Record<string, string | StringRecord>>;

export interface Product {
  description?: string;
  rating?: number;
  reviewCount?: number;
  stock?: number;
  images?: string[];
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
  category3?: string;
  category4?: string;
}
