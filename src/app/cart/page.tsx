"use client";

import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import { useStore } from "@/components/store-provider";
import { SmartImage } from "@/components/smart-image";
import { EmptyState } from "@/components/ui";
import { inr } from "@/lib/format";

export default function CartPage() {
  const { cart, hydrated, cartSubtotal, updateQuantity, updateSize, removeFromCart } = useStore();

  if (!hydrated) {
    return (
      <div className="container-ww py-24">
        <p className="text-sm text-smoke">Loading your bag…</p>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="container-ww py-16">
        <h1 className="display text-[clamp(2.2rem,4vw,3.4rem)]">Your bag</h1>
        <div className="mt-8">
          <EmptyState
            icon={<ShoppingBag className="h-7 w-7" />}
            title="Your bag is empty"
            description="Browse the catalogue or let the AI stylist assemble a look you can add in one tap."
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/shop" className="btn-primary">Shop the collection</Link>
                <Link href="/ai-stylist" className="btn-secondary">Style me</Link>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  const mrpTotal = cart.reduce((sum, line) => sum + line.mrp * line.quantity, 0);
  const savings = Math.max(0, mrpTotal - cartSubtotal);
  const retailers = new Set(cart.map((line) => line.retailer));

  return (
    <div className="container-ww py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Your bag</p>
          <h1 className="display mt-2 text-[clamp(2rem,3.6vw,3rem)]">
            {cart.reduce((sum, line) => sum + line.quantity, 0)} pieces
          </h1>
        </div>
        <Link href="/shop" className="text-[11px] uppercase tracking-[0.14em] text-smoke hover:text-ink">
          Continue shopping →
        </Link>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="border-t border-ink/10">
          {cart.map((line) => (
            <div key={line.key} className="flex gap-4 border-b border-ink/10 py-5">
              <Link href={`/product/${line.slug}`} className="w-24 shrink-0 sm:w-28">
                <div className="aspect-[3/4] overflow-hidden bg-sand">
                  <SmartImage src={line.image} alt={line.name} label={line.name} />
                </div>
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-smoke">{line.brand}</p>
                    <Link href={`/product/${line.slug}`} className="mt-0.5 block truncate font-display text-lg">
                      {line.name}
                    </Link>
                    <p className="mt-1 text-[11px] text-stone">Sold by {line.retailer}</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(line.key)}
                    aria-label={`Remove ${line.name}`}
                    className="text-stone transition-colors hover:text-ink"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-[11px] text-smoke">
                    Size
                    <select
                      value={line.size}
                      onChange={(event) => updateSize(line.key, event.target.value)}
                      className="border border-ink/15 bg-paper px-2 py-1.5 text-[11px] text-ink outline-none focus:border-ink"
                      aria-label={`Size for ${line.name}`}
                    >
                      {[line.size, ...["XS", "S", "M", "L", "XL", "XXL", "28", "30", "32", "34", "36", "38", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "One Size"]]
                        .filter((size, index, array) => array.indexOf(size) === index)
                        .map((size) => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                    </select>
                  </label>

                  <div className="flex items-center border border-ink/15">
                    <button
                      onClick={() => updateQuantity(line.key, line.quantity - 1)}
                      className="px-2.5 py-1.5 text-ink"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-7 text-center text-xs tabular">{line.quantity}</span>
                    <button
                      onClick={() => updateQuantity(line.key, line.quantity + 1)}
                      className="px-2.5 py-1.5 text-ink"
                      aria-label="Increase quantity"
                      disabled={line.quantity >= 10}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div className="mt-auto flex items-baseline gap-2 pt-3">
                  <span className="text-sm font-medium tabular">{inr(line.price * line.quantity)}</span>
                  {line.mrp > line.price && (
                    <span className="text-[11px] text-stone line-through tabular">
                      {inr(line.mrp * line.quantity)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="h-fit border border-ink/10 bg-cream p-6 lg:sticky lg:top-24">
          <p className="text-[10px] uppercase tracking-[0.16em] text-smoke">Order summary</p>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-smoke">Subtotal (MRP)</dt>
              <dd className="tabular">{inr(mrpTotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-smoke">Discount</dt>
              <dd className="tabular text-clay">− {inr(savings)}</dd>
            </div>
            <div className="flex justify-between border-t border-ink/10 pt-3">
              <dt className="text-smoke">Estimated total</dt>
              <dd className="text-base font-medium tabular">{inr(cartSubtotal)}</dd>
            </div>
          </dl>

          <Link href="/checkout" className="btn-primary mt-6 w-full">
            Checkout <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          <p className="mt-3 flex items-start gap-2 text-[10px] leading-relaxed text-stone">
            <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Checkout opens {[...retailers].join(", ")} to complete the purchase. WearWise does not
            take payment.
          </p>

          <div className="mt-5 border-t border-ink/10 pt-4">
            <p className="text-[10px] uppercase tracking-[0.12em] text-smoke">Have a brief?</p>
            <p className="mt-1 text-[11px] leading-relaxed text-graphite">
              The stylist can rebuild this bag as a complete, budget-checked outfit.
            </p>
            <Link href="/ai-stylist" className="mt-2 inline-flex text-[11px] underline underline-offset-2">
              Try the AI stylist
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
