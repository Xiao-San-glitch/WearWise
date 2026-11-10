import type { Metadata } from "next";
import { getProducts } from "@/lib/db";
import { CatalogPage } from "@/components/catalog-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Men's Fashion",
  description: "Men's fashion from Indian labels — tailoring, denim, shirts and sneakers, styled by AI within your budget.",
};

export default async function MenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <CatalogPage
      eyebrow="Men's fashion"
      title="Considered essentials"
      description="Oxford shirting, straight denim and clean sneakers. Build a wardrobe that works harder than it looks."
      products={getProducts()}
      searchParams={await searchParams}
      lockedAudience={["men"]}
      heroImage="/products/1043474.jpg"
      heroCaption="Tailoring, softened for every day"
    />
  );
}
