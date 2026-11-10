import type { Metadata } from "next";
import { getProducts } from "@/lib/db";
import { CatalogPage } from "@/components/catalog-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Women's Fashion",
  description: "Women's fashion from Indian labels — dresses, ethnic wear, tailoring and accessories, styled by AI within your budget.",
};

export default async function WomenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <CatalogPage
      eyebrow="Women's fashion"
      title="Soft structure, sharp lines"
      description="Fluid tailoring, considered dresses and celebration pieces — with a stylist on hand to build the full look."
      products={getProducts()}
      searchParams={await searchParams}
      lockedAudience={["women"]}
      heroImage="/products/31651963.jpg"
      heroCaption="The autumn edit · drapes and tailoring"
    />
  );
}
