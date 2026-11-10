"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, ShoppingBag, Sparkles, Trash2 } from "lucide-react";
import { useStore } from "@/components/store-provider";
import { SmartImage } from "@/components/smart-image";
import { EmptyState } from "@/components/ui";
import { inr } from "@/lib/format";

export default function WishlistPage() {
  const {
    wishlist,
    looks,
    hydrated,
    toggleWishlist,
    addToCart,
    removeLook,
    notify,
  } = useStore();
  const [tab, setTab] = useState<"products" | "looks">("products");

  if (!hydrated) {
    return (
      <div className="container-ww py-24">
        <p className="text-sm text-smoke">Loading your wishlist…</p>
      </div>
    );
  }

  function moveToBag(item: (typeof wishlist)[number]) {
    addToCart({
      productId: item.id,
      slug: item.slug,
      name: item.name,
      brand: item.brand,
      image: item.image,
      price: item.price,
      mrp: item.mrp,
      size: "M",
      retailer: "Partner retailer",
      affiliateUrl: `/go/${item.id}`,
    });
    notify("Added — you can change the size in your bag");
  }

  function shopLook(look: (typeof looks)[number]) {
    for (const item of look.items) {
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

  const empty = tab === "products" ? wishlist.length === 0 : looks.length === 0;

  return (
    <div className="container-ww py-10 sm:py-14">
      <p className="eyebrow">Saved for later</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <h1 className="display text-[clamp(2rem,3.8vw,3.2rem)]">Your wishlist</h1>
        <p className="text-[11px] uppercase tracking-[0.12em] text-smoke">
          {wishlist.length} products · {looks.length} looks
        </p>
      </div>

      <div className="mt-8 flex gap-6 border-b border-ink/10">
        {[
          { key: "products" as const, label: `Products (${wishlist.length})` },
          { key: "looks" as const, label: `Saved looks (${looks.length})` },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`-mb-px border-b pb-3 text-[11px] uppercase tracking-[0.14em] transition-colors ${
              tab === item.key ? "border-ink text-ink" : "border-transparent text-smoke hover:text-ink"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {empty ? (
        <div className="mt-10">
          <EmptyState
            icon={<Heart className="h-7 w-7" />}
            title={tab === "products" ? "No saved products yet" : "No saved looks yet"}
            description={
              tab === "products"
                ? "Tap the heart on any product to keep it here. Your wishlist stays on this device between visits."
                : "Generate a look with the AI stylist and hit “Save outfit” to keep it here for later."
            }
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/shop" className="btn-secondary">Browse products</Link>
                <Link href="/ai-stylist" className="btn-primary">
                  <Sparkles className="h-3.5 w-3.5" /> Build a look
                </Link>
              </div>
            }
          />
        </div>
      ) : tab === "products" ? (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
          {wishlist.map((item) => (
            <article key={item.id} className="group">
              <div className="relative overflow-hidden bg-sand">
                <Link href={`/product/${item.slug}`}>
                  <div className="aspect-[3/4]">
                    <SmartImage src={item.image} alt={item.name} label={item.name} />
                  </div>
                </Link>
                <button
                  onClick={() => toggleWishlist(item)}
                  className="absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-paper/90"
                  aria-label={`Remove ${item.name} from wishlist`}
                >
                  <Heart className="h-4 w-4 fill-ink" />
                </button>
              </div>
              <p className="mt-4 text-[10px] uppercase tracking-[0.14em] text-smoke">{item.brand}</p>
              <Link href={`/product/${item.slug}`} className="mt-1 block font-display text-[17px] leading-snug">
                {item.name}
              </Link>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-sm font-medium tabular">{inr(item.price)}</span>
                {item.mrp > item.price && (
                  <span className="text-xs text-stone line-through tabular">{inr(item.mrp)}</span>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => moveToBag(item)} className="btn-secondary flex-1 py-2 text-[10px]">
                  <ShoppingBag className="h-3.5 w-3.5" /> Move to bag
                </button>
                <Link
                  href={`/product/${item.slug}`}
                  className="flex items-center justify-center border border-ink/15 px-3 text-ink transition-colors hover:border-ink"
                  aria-label={`View ${item.name}`}
                >
                  →
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {looks.map((look) => (
            <article key={look.id} className="border border-ink/10 bg-paper">
              <div className="grid grid-cols-4 gap-px bg-ink/10">
                {look.items.slice(0, 4).map((item) => (
                  <Link key={item.id} href={`/product/${item.slug}`} className="aspect-[3/4] overflow-hidden bg-sand">
                    <SmartImage src={item.image} alt={item.name} label={item.name} />
                  </Link>
                ))}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.14em] text-smoke">
                      Saved {new Date(look.createdAt).toLocaleDateString("en-IN")}
                    </p>
                    <h2 className="mt-1 font-display text-xl">{look.title}</h2>
                  </div>
                  <span className="text-sm font-medium tabular">{inr(look.total)}</span>
                </div>
                <p className="mt-2 text-[11px] text-smoke">
                  {look.items.map((item) => item.name).join(" · ")}
                </p>
                {look.explanation && (
                  <p className="mt-3 line-clamp-3 text-[11px] leading-relaxed text-graphite">
                    {look.explanation}
                  </p>
                )}
                <div className="mt-4 flex gap-2">
                  <button onClick={() => shopLook(look)} className="btn-primary flex-1 py-2.5 text-[10px]">
                    <ShoppingBag className="h-3.5 w-3.5" /> Shop this look
                  </button>
                  <button
                    onClick={() => removeLook(look.id)}
                    className="flex h-10 w-10 items-center justify-center border border-ink/15 text-smoke hover:border-ink hover:text-ink"
                    aria-label={`Remove ${look.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="mt-12 border-t border-ink/10 pt-6 text-[11px] leading-relaxed text-stone">
        Your wishlist and saved looks are stored in this browser. Sign in to keep saved looks on your
        account as well.
      </p>
    </div>
  );
}
