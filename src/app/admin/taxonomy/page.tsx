import { getDb } from "@/lib/db";
import { TaxonomyManager } from "@/components/taxonomy-manager";

export const dynamic = "force-dynamic";

export default function AdminTaxonomyPage() {
  const db = getDb();
  const categoryUsage: Record<string, number> = {};
  const brandUsage: Record<string, number> = {};
  for (const product of db.products) {
    categoryUsage[product.category] = (categoryUsage[product.category] ?? 0) + 1;
    brandUsage[product.brand] = (brandUsage[product.brand] ?? 0) + 1;
  }

  return (
    <div>
      <p className="eyebrow">Catalogue</p>
      <h1 className="display mt-2 text-[clamp(1.8rem,3.2vw,2.6rem)]">Categories & brands</h1>
      <p className="mt-1 text-sm text-smoke">
        Categories and brands power the storefront filters and the stylist&apos;s category preferences.
      </p>

      <div className="mt-8">
        <TaxonomyManager
          categories={db.categories}
          brands={db.brands}
          categoryUsage={categoryUsage}
          brandUsage={brandUsage}
        />
      </div>
    </div>
  );
}
