import Link from "next/link";
import { Plus } from "lucide-react";
import { getDb } from "@/lib/db";
import { AdminProductsTable } from "@/components/admin-products-table";

export const dynamic = "force-dynamic";

export default function AdminProductsPage() {
  const db = getDb();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Catalogue</p>
          <h1 className="display mt-2 text-[clamp(1.8rem,3.2vw,2.6rem)]">Products</h1>
          <p className="mt-1 text-sm text-smoke">
            {db.products.length} products · {db.brands.length} brands
          </p>
        </div>
        <Link href="/admin/products/new" className="btn-primary py-2.5 text-[10px]">
          <Plus className="h-3.5 w-3.5" /> Add product
        </Link>
      </div>

      <div className="mt-6">
        <AdminProductsTable products={db.products} />
      </div>
    </div>
  );
}
