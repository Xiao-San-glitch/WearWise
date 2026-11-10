import type { Metadata } from "next";
import { getProducts } from "@/lib/db";
import { CatalogPage } from "@/components/catalog-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Streetwear",
  description: "Oversized tees, heavy hoodies, denim and retro sneakers — streetwear curated for Indian cities.",
};

export default async function StreetwearPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <CatalogPage
      eyebrow="Streetwear"
      title="Concrete and cotton"
      description="Oversized silhouettes, washed denim and low-top sneakers. Streetwear with a clean finish — nothing loud for the sake of it."
      products={getProducts()}
      searchParams={await searchParams}
      lockedStyle={["Streetwear"]}
      heroImage="/products/32430590.jpg"
      heroCaption="Dropped shoulders · washed denim · retro soles"
    />
  );
}
