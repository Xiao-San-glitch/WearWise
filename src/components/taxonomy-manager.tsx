"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface Category {
  name: string;
  slug: string;
  image: string;
  blurb: string;
}

export function TaxonomyManager({
  categories,
  brands,
  categoryUsage,
  brandUsage,
}: {
  categories: Category[];
  brands: string[];
  categoryUsage: Record<string, number>;
  brandUsage: Record<string, number>;
}) {
  const router = useRouter();
  const [categoryName, setCategoryName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function add(type: "category" | "brand") {
    const name = type === "category" ? categoryName : brandName;
    if (!name.trim()) return;
    setBusy(`add-${type}`);
    setError("");
    try {
      const response = await fetch("/api/admin/taxonomy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, name }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not add.");
        return;
      }
      if (type === "category") setCategoryName("");
      else setBrandName("");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function remove(type: "category" | "brand", name: string) {
    if (!window.confirm(`Remove ${name}?`)) return;
    setBusy(`del-${name}`);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/taxonomy?type=${type}&name=${encodeURIComponent(name)}`,
        { method: "DELETE" },
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not remove.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-10">
      {error && <p className="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

      <section>
        <h2 className="font-display text-xl">Categories</h2>
        <div className="mt-3 flex gap-2">
          <input
            value={categoryName}
            onChange={(event) => setCategoryName(event.target.value)}
            placeholder="New category name"
            className="input max-w-xs"
          />
          <button onClick={() => add("category")} className="btn-secondary py-2.5 text-[10px]" disabled={busy === "add-category"}>
            {busy === "add-category" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Add
          </button>
        </div>
        <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
          {categories.map((category) => (
            <li key={category.name} className="flex items-center gap-4 py-3">
              <img src={category.image} alt="" className="h-12 w-9 object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-sm">{category.name}</p>
                <p className="text-[10px] uppercase tracking-[0.1em] text-stone">
                  {categoryUsage[category.name] ?? 0} products
                </p>
              </div>
              <button
                onClick={() => remove("category", category.name)}
                disabled={busy === `del-${category.name}`}
                className="text-smoke hover:text-red-700"
                aria-label={`Remove ${category.name}`}
              >
                {busy === `del-${category.name}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-display text-xl">Brands</h2>
        <div className="mt-3 flex gap-2">
          <input
            value={brandName}
            onChange={(event) => setBrandName(event.target.value)}
            placeholder="New brand name"
            className="input max-w-xs"
          />
          <button onClick={() => add("brand")} className="btn-secondary py-2.5 text-[10px]" disabled={busy === "add-brand"}>
            {busy === "add-brand" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Add
          </button>
        </div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {brands.map((brand) => (
            <li key={brand} className="flex items-center justify-between gap-3 border border-ink/10 px-3 py-2.5">
              <span className="text-sm">{brand}</span>
              <span className="flex items-center gap-3">
                <span className="text-[10px] uppercase tracking-[0.1em] text-stone">
                  {brandUsage[brand] ?? 0} products
                </span>
                <button
                  onClick={() => remove("brand", brand)}
                  disabled={busy === `del-${brand}`}
                  className="text-smoke hover:text-red-700"
                  aria-label={`Remove ${brand}`}
                >
                  {busy === `del-${brand}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
