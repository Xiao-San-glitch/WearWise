"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ExternalLink, Loader2, Pencil, Search, Trash2 } from "lucide-react";
import type { Product } from "@/lib/types";
import { inr } from "@/lib/format";

export function AdminProductsTable({ products }: { products: Product[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) =>
      [product.name, product.brand, product.category, product.id, product.retailer]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [products, query]);

  async function remove(product: Product) {
    if (!window.confirm(`Delete “${product.name}”? This cannot be undone.`)) return;
    setDeleting(product.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setError(data.error ?? "Could not delete the product.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 border border-ink/15 px-3 py-2">
          <Search className="h-3.5 w-3.5 text-stone" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, brand, ID…"
            className="w-56 bg-transparent text-xs outline-none"
            aria-label="Search products"
          />
        </label>
        <p className="text-[10px] uppercase tracking-[0.12em] text-stone">
          {filtered.length} of {products.length} products
        </p>
      </div>

      {error && <p className="mt-3 border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

      <div className="mt-4 overflow-x-auto border border-ink/10">
        <table className="w-full min-w-[820px] border-collapse text-left">
          <thead>
            <tr className="border-b border-ink/10 bg-cream text-[9px] uppercase tracking-[0.14em] text-smoke">
              <th className="px-3 py-3 font-medium">Product</th>
              <th className="px-3 py-3 font-medium">Category</th>
              <th className="px-3 py-3 font-medium">Price</th>
              <th className="px-3 py-3 font-medium">Stock</th>
              <th className="px-3 py-3 font-medium">Retailer</th>
              <th className="px-3 py-3 font-medium">Flags</th>
              <th className="px-3 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => (
              <tr key={product.id} className="border-b border-ink/5 text-xs hover:bg-cream/40">
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <img src={product.image} alt="" className="h-12 w-9 shrink-0 object-cover" />
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-medium">{product.name}</p>
                      <p className="text-[10px] uppercase tracking-[0.08em] text-stone">
                        {product.brand} · {product.id}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-smoke">{product.category}</td>
                <td className="px-3 py-2.5 tabular">
                  {inr(product.price)}
                  <span className="ml-1 text-[10px] text-stone line-through">{inr(product.mrp)}</span>
                </td>
                <td className="px-3 py-2.5 tabular">{product.stock}</td>
                <td className="px-3 py-2.5 text-smoke">{product.retailer}</td>
                <td className="px-3 py-2.5">
                  {product.sponsored ? (
                    <span className="bg-ink px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-cream">
                      Sponsored
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone">Organic</span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/product/${product.slug}`}
                      target="_blank"
                      className="flex h-8 w-8 items-center justify-center text-smoke hover:text-ink"
                      aria-label={`Open ${product.name}`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="flex h-8 w-8 items-center justify-center text-smoke hover:text-ink"
                      aria-label={`Edit ${product.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      onClick={() => remove(product)}
                      disabled={deleting === product.id}
                      className="flex h-8 w-8 items-center justify-center text-smoke hover:text-red-700"
                      aria-label={`Delete ${product.name}`}
                    >
                      {deleting === product.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-smoke">
                  No products match “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
