"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, ExternalLink, Loader2, Save } from "lucide-react";
import { inr } from "@/lib/format";

export interface AffiliateRow {
  id: string;
  name: string;
  brand: string;
  retailer: string;
  affiliateUrl: string;
  sponsored: boolean;
  price: number;
  image: string;
}

export function AffiliateManager({ rows }: { rows: AffiliateRow[] }) {
  const router = useRouter();
  const [items, setItems] = useState(rows);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  function update(id: string, patch: Partial<AffiliateRow>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  async function saveAll() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/affiliate", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: items.map((item) => ({
            id: item.id,
            affiliateUrl: item.affiliateUrl,
            sponsored: item.sponsored,
            retailer: item.retailer,
          })),
        }),
      });
      const data = (await response.json()) as { error?: string; updated?: number };
      if (!response.ok) {
        setError(data.error ?? "Could not save links.");
        return;
      }
      setMessage(`${data.updated ?? 0} products updated.`);
      router.refresh();
      setTimeout(() => setMessage(""), 3000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const filtered = items.filter((item) =>
    `${item.name} ${item.brand} ${item.retailer}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter products…"
          className="input max-w-xs"
          aria-label="Filter affiliate products"
        />
        <button onClick={saveAll} className="btn-primary py-2.5 text-[10px]" disabled={saving}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save all changes
        </button>
      </div>

      {message && (
        <p className="mt-3 flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          <Check className="h-3.5 w-3.5" /> {message}
        </p>
      )}
      {error && <p className="mt-3 border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

      <div className="mt-4 space-y-2">
        {filtered.map((item) => (
          <div key={item.id} className="border border-ink/10 bg-paper p-3">
            <div className="flex flex-wrap items-center gap-3">
              <img src={item.image} alt="" className="h-14 w-11 object-cover" />
              <div className="min-w-[160px] flex-1">
                <p className="text-sm">{item.name}</p>
                <p className="text-[10px] uppercase tracking-[0.1em] text-stone">
                  {item.brand} · {item.id} · {inr(item.price)}
                </p>
              </div>
              <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.1em] text-smoke">
                Retailer
                <input
                  value={item.retailer}
                  onChange={(event) => update(item.id, { retailer: event.target.value })}
                  className="border border-ink/15 px-2 py-1.5 text-[11px] text-ink outline-none focus:border-ink"
                  aria-label={`Retailer for ${item.name}`}
                />
              </label>
              <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.1em] text-smoke">
                <input
                  type="checkbox"
                  checked={item.sponsored}
                  onChange={(event) => update(item.id, { sponsored: event.target.checked })}
                  className="h-3.5 w-3.5 accent-ink"
                />
                Sponsored
              </label>
              <a
                href={item.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center border border-ink/15 text-smoke hover:border-ink hover:text-ink"
                aria-label={`Test link for ${item.name}`}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            <input
              value={item.affiliateUrl}
              onChange={(event) => update(item.id, { affiliateUrl: event.target.value })}
              className="mt-2 w-full border border-ink/10 bg-cream/50 px-3 py-2 text-[11px] text-graphite outline-none focus:border-ink"
              aria-label={`Affiliate URL for ${item.name}`}
            />
          </div>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="mt-4 border border-dashed border-ink/15 p-8 text-center text-sm text-smoke">
          No products match “{query}”.
        </p>
      )}
    </div>
  );
}
