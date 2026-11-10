import { notFound } from "next/navigation";
import { getDb, getProductById } from "@/lib/db";
import { AdminProductForm } from "@/components/admin-product-form";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getProductById(id);
  if (!product) notFound();
  const db = getDb();

  return (
    <div>
      <p className="eyebrow">Catalogue · {product.id}</p>
      <h1 className="display mt-2 text-[clamp(1.8rem,3.2vw,2.6rem)]">Edit product</h1>
      <p className="mt-1 text-sm text-smoke">
        Changes update the storefront, search index and stylist catalogue.
      </p>

      <div className="mt-8 max-w-4xl">
        <AdminProductForm
          categories={db.categories.map((category) => category.name)}
          brands={db.brands}
          initial={product}
        />
      </div>
    </div>
  );
}
