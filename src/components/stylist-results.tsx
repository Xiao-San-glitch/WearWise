"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Check,
  Loader2,
  RefreshCw,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Wallet,
} from "lucide-react";
import type { StylistPreferences, StylistResponse } from "@/lib/types";
import { inr } from "@/lib/format";
import { useStore } from "./store-provider";
import { SmartImage } from "./smart-image";

type ResultPayload = StylistResponse & {
  preferences: StylistPreferences;
  configured?: boolean;
};

const REFINEMENTS = [
  { label: "More affordable", prompt: "Make this noticeably more affordable while keeping the same occasion and style." },
  { label: "Different colours", prompt: "Use a different colour palette that still suits the occasion." },
  { label: "More formal", prompt: "Make this look more formal and polished." },
  { label: "More casual", prompt: "Make this look more relaxed and casual." },
  { label: "Different style", prompt: "Try a different but adjacent style direction." },
];

export function StylistResults() {
  const router = useRouter();
  const { addToCart, saveLook, notify } = useStore();
  const [data, setData] = useState<ResultPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem("wearwise:stylist");
      if (raw) setData(JSON.parse(raw) as ResultPayload);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  async function regenerate(refinement?: string) {
    if (!data) return;
    setLoading(true);
    try {
      const response = await fetch("/api/ai/stylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audience: data.preferences.audience,
          customBudget: data.preferences.budget,
          occasion: data.preferences.occasion,
          style: data.preferences.style,
          colors: data.preferences.colors,
          season: data.preferences.season,
          categories: data.preferences.categories,
          fit: data.preferences.fit,
          instructions: data.preferences.instructions,
          refinement,
        }),
      });
      if (!response.ok) throw new Error("failed");
      const payload = (await response.json()) as ResultPayload;
      setData(payload);
      window.sessionStorage.setItem("wearwise:stylist", JSON.stringify(payload));
      setSaved([]);
    } catch {
      notify("Couldn't regenerate that look. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function shopLook(outfitId: string) {
    const outfit = data?.outfits.find((entry) => entry.id === outfitId);
    if (!outfit) return;
    for (const item of outfit.items) {
      addToCart({
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
      });
    }
    router.push("/cart");
  }

  async function saveOutfit(outfitId: string) {
    const outfit = data?.outfits.find((entry) => entry.id === outfitId);
    if (!outfit) return;

    saveLook({
      id: outfit.id,
      title: outfit.title,
      total: outfit.total,
      explanation: outfit.rationale,
      items: outfit.items.map((item) => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        brand: item.brand,
        image: item.image,
        price: item.price,
      })),
    });
    setSaved((prev) => [...prev, outfit.id]);

    try {
      const response = await fetch("/api/outfits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: outfit.title,
          productIds: outfit.items.map((item) => item.id),
          explanation: outfit.rationale,
          preferences: data?.preferences ?? {},
        }),
      });
      if (response.ok) notify("Look saved to your account");
    } catch {
      /* local save already succeeded */
    }
  }

  if (!ready) {
    return <div className="container-ww py-24 text-sm text-smoke">Loading your looks…</div>;
  }

  if (!data) {
    return (
      <div className="container-ww py-20">
        <div className="mx-auto max-w-lg border border-ink/10 bg-cream p-10 text-center">
          <Sparkles className="mx-auto h-7 w-7 text-stone" />
          <h1 className="display mt-4 text-3xl">No look to show yet</h1>
          <p className="mt-3 text-sm leading-relaxed text-smoke">
            Fill in a short brief and the stylist will assemble three complete outfits within your
            budget.
          </p>
          <Link href="/ai-stylist" className="btn-primary mt-6">
            Build my look <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  const prefs = data.preferences;
  const primary = data.outfits[0];

  return (
    <div>
      <section className="border-b border-ink/10 bg-cream">
        <div className="container-ww py-10 sm:py-14">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 border border-ink/20 bg-paper px-2.5 py-1 text-[10px] uppercase tracking-[0.14em]">
                  {data.source === "gemini" ? (
                    <>
                      <Sparkles className="h-3 w-3" /> Live AI styling
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3" /> Stylist engine
                    </>
                  )}
                </span>
                <span className="text-[10px] uppercase tracking-[0.14em] text-smoke">
                  {prefs.audience} · {prefs.occasion} · {prefs.style}
                </span>
              </div>
              <h1 className="display mt-4 max-w-2xl text-[clamp(2rem,4.2vw,3.2rem)]">
                {data.outfits.length} {data.outfits.length === 1 ? "look" : "looks"} for you
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-graphite">{data.summary}</p>
            </div>

            <div className="grid w-full max-w-xs grid-cols-2 gap-px border border-ink/15 bg-ink/15 md:w-auto">
              <div className="bg-paper p-4">
                <p className="text-[10px] uppercase tracking-[0.12em] text-smoke">Budget</p>
                <p className="mt-1 font-display text-xl">{inr(prefs.budget)}</p>
              </div>
              <div className="bg-paper p-4">
                <p className="text-[10px] uppercase tracking-[0.12em] text-smoke">First look</p>
                <p className="mt-1 font-display text-xl">{primary ? inr(primary.total) : "—"}</p>
              </div>
              <div className="col-span-2 flex items-center justify-between bg-paper px-4 py-2.5">
                <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-smoke">
                  <Wallet className="h-3 w-3" /> Remaining
                </span>
                <span className="text-sm font-medium">
                  {primary ? inr(Math.max(0, prefs.budget - primary.total)) : "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            <button onClick={() => regenerate()} className="btn-secondary py-2.5 text-[10px]" disabled={loading}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Generate another look
            </button>
            <Link href="/ai-stylist" className="btn-secondary py-2.5 text-[10px]">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Change preferences
            </Link>
            <Link href="/wishlist" className="btn-secondary py-2.5 text-[10px]">
              <Bookmark className="h-3.5 w-3.5" /> Saved looks
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.14em] text-smoke">Refine:</span>
            {REFINEMENTS.map((refinement) => (
              <button
                key={refinement.label}
                onClick={() => regenerate(refinement.prompt)}
                disabled={loading}
                className="chip px-3 py-1.5 normal-case tracking-normal disabled:opacity-50"
              >
                {refinement.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="container-ww py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          {data.outfits.map((outfit, index) => {
            const remaining = prefs.budget - outfit.total;
            const isSaved = saved.includes(outfit.id);
            return (
              <article key={outfit.id} className="flex flex-col border border-ink/10 bg-paper">
                <div className="grid grid-cols-3 gap-px bg-ink/10">
                  {outfit.items.slice(0, 3).map((item, itemIndex) => (
                    <Link
                      key={`${outfit.id}-${item.id}`}
                      href={`/product/${item.slug}`}
                      className={
                        itemIndex === 0
                          ? "relative col-span-3 aspect-[16/11] overflow-hidden bg-sand"
                          : "relative aspect-square overflow-hidden bg-sand"
                      }
                    >
                      <SmartImage src={item.image} alt={item.name} label={item.name} />
                      <span className="absolute bottom-2 left-2 bg-paper/90 px-2 py-1 text-[9px] uppercase tracking-[0.1em]">
                        {item.category}
                      </span>
                    </Link>
                  ))}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-smoke">Look {index + 1}</p>
                      <h2 className="mt-1 font-display text-xl leading-snug">{outfit.title}</h2>
                    </div>
                    <span className="whitespace-nowrap text-sm font-medium tabular">{inr(outfit.total)}</span>
                  </div>

                  <p className="mt-3 text-[12px] leading-relaxed text-graphite">{outfit.rationale}</p>

                  <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
                    {outfit.items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <Link href={`/product/${item.slug}`} className="block truncate text-[12px] hover:underline">
                            {item.name}
                          </Link>
                          <p className="text-[10px] uppercase tracking-[0.1em] text-stone">
                            {item.brand} · {item.color} · {item.styles[0]}
                          </p>
                        </div>
                        <span className="shrink-0 text-[11px] tabular">{inr(item.price)}</span>
                      </li>
                    ))}
                  </ul>

                  <p className="mt-3 flex items-center gap-1.5 text-[11px] text-smoke">
                    <Check className="h-3 w-3 text-emerald-700" />
                    {remaining >= 0
                      ? `${inr(remaining)} under budget`
                      : `${inr(Math.abs(remaining))} over budget`}
                  </p>

                  <div className="mt-3 border-l-2 border-ink/20 pl-3">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-smoke">Styling tip</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-graphite">{outfit.stylingTip}</p>
                  </div>

                  <div className="mt-auto space-y-2 pt-5">
                    <button onClick={() => shopLook(outfit.id)} className="btn-primary w-full py-2.5 text-[10px]">
                      <ShoppingBag className="h-3.5 w-3.5" /> Shop this look
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => saveOutfit(outfit.id)}
                        className="btn-secondary py-2.5 text-[10px]"
                        disabled={isSaved}
                      >
                        <Bookmark className="h-3.5 w-3.5" /> {isSaved ? "Saved" : "Save outfit"}
                      </button>
                      <Link
                        href={`/go/${outfit.items[0]?.id}?source=stylist`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary py-2.5 text-[10px]"
                      >
                        Retailer <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <p className="mt-10 border-t border-ink/10 pt-6 text-[11px] leading-relaxed text-stone">
          Looks are generated from the live catalogue. Prices, availability and colours are set by
          partner retailers. WearWise does not process payments — “Shop this look” adds the pieces to
          your bag, and checkout happens on each retailer&apos;s site.
        </p>
      </section>
    </div>
  );
}
