"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { inr } from "@/lib/format";
import { SmartImage } from "./smart-image";
import { useStore } from "./store-provider";

interface Item {
  id: string;
  slug: string;
  name: string;
  brand: string;
  image: string;
  price: number;
}

export interface SavedOutfitView {
  id: string;
  title: string;
  total: number;
  explanation: string;
  createdAt: string;
  items: Item[];
}

export function AccountOutfits({ outfits }: { outfits: SavedOutfitView[] }) {
  const router = useRouter();
  const { addToCart } = useStore();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function remove(id: string) {
    setDeleting(id);
    await fetch(`/api/outfits?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setDeleting(null);
    router.refresh();
  }

  function shop(outfit: SavedOutfitView) {
    for (const item of outfit.items) {
      addToCart({
        productId: item.id,
        slug: item.slug,
        name: item.name,
        brand: item.brand,
        image: item.image,
        price: item.price,
        mrp: item.price,
        size: "M",
        retailer: "Partner retailer",
        affiliateUrl: `/go/${item.id}`,
      });
    }
  }

  if (!outfits.length) {
    return (
      <div className="border border-dashed border-ink/15 bg-cream/40 p-8 text-center">
        <p className="font-display text-xl">No saved looks yet</p>
        <p className="mt-2 text-sm text-smoke">
          Save outfits from the AI Stylist and they&apos;ll appear here on your account.
        </p>
        <Link href="/ai-stylist" className="btn-primary mt-5">Build a look</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {outfits.map((outfit) => (
        <article key={outfit.id} className="border border-ink/10 bg-paper">
          <div className="grid grid-cols-4 gap-px bg-ink/10">
            {outfit.items.slice(0, 4).map((item) => (
              <Link key={item.id} href={`/product/${item.slug}`} className="aspect-[3/4] overflow-hidden bg-sand">
                <SmartImage src={item.image} alt={item.name} label={item.name} />
              </Link>
            ))}
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] text-stone">
                  {new Date(outfit.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <h3 className="mt-1 font-display text-lg">{outfit.title}</h3>
              </div>
              <span className="text-sm font-medium tabular">{inr(outfit.total)}</span>
            </div>
            <p className="mt-2 text-[11px] text-smoke">
              {outfit.items.map((item) => item.name).join(" · ")}
            </p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => shop(outfit)} className="btn-secondary flex-1 py-2 text-[10px]">
                Shop this look
              </button>
              <button
                onClick={() => remove(outfit.id)}
                disabled={deleting === outfit.id}
                className="flex h-9 w-9 items-center justify-center border border-ink/15 text-smoke hover:border-ink hover:text-ink"
                aria-label={`Delete ${outfit.title}`}
              >
                {deleting === outfit.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
