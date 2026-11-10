"use client";

import Link from "next/link";
import { ArrowUpRight, ShoppingBag } from "lucide-react";
import type { OutfitRecommendation } from "@/lib/types";
import { inr } from "@/lib/format";
import { useStore } from "./store-provider";
import { SmartImage } from "./smart-image";

export function OutfitComboCard({ outfit, index }: { outfit: OutfitRecommendation; index: number }) {
  const { addToCart } = useStore();

  function addAll() {
    for (const item of outfit.items) {
      addToCart(
        {
          productId: item.id,
          slug: item.slug,
          name: item.name,
          brand: item.brand,
          image: item.image,
          price: item.price,
          mrp: item.mrp,
          size: item.sizes[Math.floor(item.sizes.length / 2)] ?? item.sizes[0] ?? "M",
          retailer: item.retailer,
          affiliateUrl: item.affiliateUrl,
        },
        1,
      );
    }
  }

  return (
    <article className="group flex flex-col border border-ink/10 bg-paper">
      <div className="grid grid-cols-3 gap-px bg-ink/10">
        {outfit.items.slice(0, 3).map((item, itemIndex) => (
          <Link
            key={item.id}
            href={`/product/${item.slug}`}
            className={
              itemIndex === 0 && outfit.items.length >= 3
                ? "relative col-span-3 aspect-[16/10] overflow-hidden bg-sand sm:col-span-3"
                : "relative aspect-[3/4] overflow-hidden bg-sand"
            }
          >
            <SmartImage
              src={item.image}
              alt={item.name}
              className="transition-transform duration-700 group-hover:scale-[1.03]"
              label={item.name}
            />
          </Link>
        ))}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-smoke">
              Look {String(index + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-1.5 font-display text-xl">{outfit.title}</h3>
          </div>
          <span className="whitespace-nowrap text-sm font-medium tabular">{inr(outfit.total)}</span>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-smoke">
          {outfit.items.map((item) => item.name).join(" · ")}
        </p>

        <div className="mt-5 flex items-center gap-3">
          <button onClick={addAll} className="btn-secondary flex-1 py-2.5 text-[10px]">
            <ShoppingBag className="h-3.5 w-3.5" /> Shop this look
          </button>
          <Link
            href={`/ai-stylist?prefill=${encodeURIComponent(outfit.items[0]?.category ?? "")}`}
            className="flex h-10 w-10 items-center justify-center border border-ink/15 text-ink transition-colors hover:border-ink"
            aria-label="Style a similar look"
          >
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
