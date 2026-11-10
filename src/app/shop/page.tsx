import type { Metadata } from "next";
import { getProducts } from "@/lib/db";
import { CatalogPage } from "@/components/catalog-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop All",
  description: "Browse the full WearWise catalogue of Indian fashion, filtered by price, colour, style and brand.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const products = getProducts();
  return (
    <CatalogPage
      eyebrow="The catalogue"
      title="Shop all"
      description="Every piece in the WearWise edit — curated from Indian labels across men's, women's and unisex fashion. Filter by budget, colour or style."
      products={products}
      searchParams={await searchParams}
      heroCaption={`${products.length} pieces · 12 labels · updated weekly`}
      heroImage="/products/28576622.jpg"
    />
  );
}
