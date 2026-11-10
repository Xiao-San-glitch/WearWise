import type { Metadata } from "next";
import { getProducts } from "@/lib/db";
import { CatalogPage } from "@/components/catalog-page";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New In",
  description: "The latest arrivals in the WearWise edit, updated every week.",
};

export default async function NewInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <CatalogPage
      eyebrow="Just landed"
      title="New in"
      description="The newest additions to the catalogue, sorted by arrival. These are the pieces the styling team is working with right now."
      products={getProducts()}
      searchParams={await searchParams}
      defaultSort="newest"
      heroImage="/products/17474401.jpg"
      heroCaption="Autumn/Winter 2026 arrivals"
    />
  );
}
