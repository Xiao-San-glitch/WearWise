"use client";

import Link from "next/link";
import { ArrowUpRight, Info, ShieldCheck, ShoppingBag } from "lucide-react";
import { useStore } from "@/components/store-provider";
import { SmartImage } from "@/components/smart-image";
import { EmptyState } from "@/components/ui";
import { inr } from "@/lib/format";

export default function CheckoutPage() {
  const { cart, hydrated, cartSubtotal, clearCart } = useStore();

  if (!hydrated) {
    return (
      <div className="container-ww py-24">
        <p className="text-sm text-smoke">Preparing checkout…</p>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="container-ww py-16">
        <EmptyState
          icon={<ShoppingBag className="h-7 w-7" />}
          title="Nothing to check out"
          description="Add pieces to your bag first, then return here to complete the purchase with the retailer."
          action={<Link href="/shop" className="btn-primary">Shop the collection</Link>}
        />
      </div>
    );
  }

  const byRetailer = new Map<string, typeof cart>();
  for (const line of cart) {
    const list = byRetailer.get(line.retailer) ?? [];
    list.push(line);
    byRetailer.set(line.retailer, list);
  }

  return (
    <div className="container-ww py-10 sm:py-14">
      <p className="eyebrow">Affiliate checkout</p>
      <h1 className="display mt-2 text-[clamp(2rem,3.8vw,3.2rem)]">Review and continue</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-graphite">
        WearWise is a discovery platform. Your bag is split by retailer so you can complete each
        purchase directly on their site — secure payment, delivery and returns are handled by them.
      </p>

      <div className="mt-8 flex items-start gap-3 border border-clay/25 bg-clay/5 p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-clay" />
        <p className="text-[11px] leading-relaxed text-graphite">
          <span className="font-medium">No payment is collected on WearWise.</span> Clicking a
          retailer link records an outbound click for our affiliate reporting and opens the partner
          site. Sizes and colours may need to be re-selected there.
        </p>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-8">
          {[...byRetailer.entries()].map(([retailer, lines]) => {
            const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
            return (
              <section key={retailer} className="border border-ink/10">
                <div className="flex items-center justify-between border-b border-ink/10 bg-cream px-5 py-3">
                  <p className="text-[10px] uppercase tracking-[0.16em]">{retailer}</p>
                  <p className="text-[11px] tabular">{inr(total)}</p>
                </div>
                <div className="divide-y divide-ink/10">
                  {lines.map((line) => (
                    <div key={line.key} className="flex items-center gap-4 p-4">
                      <div className="h-20 w-16 shrink-0 overflow-hidden bg-sand">
                        <SmartImage src={line.image} alt={line.name} label={line.name} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{line.name}</p>
                        <p className="text-[10px] uppercase tracking-[0.1em] text-stone">
                          {line.brand} · Size {line.size} · Qty {line.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm tabular">{inr(line.price * line.quantity)}</p>
                        <Link
                          href={`/go/${line.productId}?source=checkout`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.1em] text-smoke hover:text-ink"
                        >
                          Open <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-ink/10 p-4">
                  <Link
                    href={`/go/${lines[0].productId}?source=checkout`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary w-full py-3 text-[10px]"
                  >
                    Continue to {retailer} <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </section>
            );
          })}
        </div>

        <aside className="h-fit border border-ink/10 bg-cream p-6 lg:sticky lg:top-24">
          <p className="text-[10px] uppercase tracking-[0.16em] text-smoke">Bag total</p>
          <p className="mt-3 font-display text-3xl tabular">{inr(cartSubtotal)}</p>
          <p className="mt-1 text-[11px] text-stone">
            {cart.reduce((sum, line) => sum + line.quantity, 0)} pieces across {byRetailer.size}{" "}
            {byRetailer.size === 1 ? "retailer" : "retailers"}
          </p>

          <div className="mt-5 space-y-2 border-t border-ink/10 pt-4 text-[11px] leading-relaxed text-smoke">
            <p className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Payment, shipping and returns are handled by the retailer under their own policies.
            </p>
            <p className="flex items-start gap-2">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              WearWise may earn a commission from these links at no extra cost to you.
            </p>
          </div>

          <button onClick={clearCart} className="btn-secondary mt-5 w-full py-2.5 text-[10px]">
            Empty my bag
          </button>
          <Link href="/cart" className="mt-2 block text-center text-[10px] uppercase tracking-[0.12em] text-smoke hover:text-ink">
            Back to bag
          </Link>
        </aside>
      </div>
    </div>
  );
}
