import { getDb } from "@/lib/db";
import { AdminProductForm } from "@/components/admin-product-form";

export const dynamic = "force-dynamic";

export default function NewProductPage() {
  const db = getDb();

  return (
    <div>
      <p className="eyebrow">Catalogue</p>
      <h1 className="display mt-2 text-[clamp(1.8rem,3.2vw,2.6rem)]">Add a product</h1>
      <p className="mt-1 text-sm text-smoke">
        New products appear in the catalogue, search and the AI stylist immediately.
      </p>

      <div className="mt-8 max-w-4xl">
        <AdminProductForm
          categories={db.categories.map((category) => category.name)}
          brands={db.brands}
        />
      </div>
    </div>
  );
}
