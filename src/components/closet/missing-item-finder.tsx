"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Info, Loader2, RefreshCw, ShoppingBag, Sparkles } from "lucide-react";
import type { MissingItemRecommendation, WardrobeItem } from "@/lib/types";
import { inr } from "@/lib/format";
import { EmptyState } from "../ui";
import { SmartImage } from "../smart-image";
import { ScoreBar, StatusNote } from "./closet-shared";

export function MissingItemFinder({
  items,
  onAddPieces,
}: {
  items: WardrobeItem[];
  onAddPieces: () => void;
}) {
  const [recommendations, setRecommendations] = useState<MissingItemRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/wardrobe/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "missing", limit: 6 }),
      });
      const data = (await response.json()) as {
        recommendations?: MissingItemRecommendation[];
        message?: string;
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "Could not analyse your wardrobe.");
        return;
      }
      setRecommendations(data.recommendations ?? []);
      setMessage(data.message ?? "");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, items.length]);

  if (!items.length) {
    return (
      <EmptyState
        icon={<Sparkles className="h-8 w-8" />}
        title="Add your wardrobe first"
        description="Missing-piece suggestions are based on what you already own. Add a few pieces and we'll find the gaps that unlock the most new outfits."
        action={
          <button onClick={onAddPieces} className="btn-primary py-2.5 text-[10px]">
            Add wardrobe pieces
          </button>
        }
      />
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl">What&apos;s missing</h2>
          <p className="mt-1 text-sm leading-relaxed text-smoke">
            Ranked by how many pieces it pairs with, the combinations it unlocks, price and occasion
            range — computed from your wardrobe, not guessed.
          </p>
        </div>
        <button onClick={load} disabled={loading} className="btn-secondary py-2.5 text-[10px]">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Re-analyse
        </button>
      </div>

      {error && (
        <div className="mt-4">
          <StatusNote kind="error">{error}</StatusNote>
        </div>
      )}
      {message && !error && (
        <div className="mt-4">
          <StatusNote kind="info">{message}</StatusNote>
        </div>
      )}

      {loading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="animate-pulse border border-ink/10 bg-paper">
              <div className="aspect-[4/5] bg-sand" />
              <div className="space-y-3 p-5">
                <div className="h-3 w-1/3 bg-sand" />
                <div className="h-4 w-2/3 bg-sand" />
                <div className="h-3 w-full bg-sand" />
              </div>
            </div>
          ))}
        </div>
      ) : recommendations.length ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {recommendations.map((entry) => (
            <article key={entry.product.id} className="flex flex-col border border-ink/10 bg-paper">
              <div className="relative aspect-[4/5] overflow-hidden bg-sand">
                <SmartImage src={entry.product.image} alt={entry.product.name} label={entry.product.name} />
                <span className="absolute left-2 top-2 bg-paper/95 px-2 py-1 text-[9px] uppercase tracking-[0.1em]">
                  {entry.product.category}
                </span>
                <div className="absolute right-2 top-2 bg-ink px-2 py-1 text-[9px] uppercase tracking-[0.1em] text-cream">
                  {entry.score}/100
                </div>
              </div>

              <div className="flex flex-1 flex-col p-4 sm:p-5">
                <p className="text-[9px] uppercase tracking-[0.12em] text-smoke">
                  {entry.product.brand} · suggested {entry.suggestedColor.toLowerCase()}
                </p>
                <h3 className="mt-1 font-display text-lg leading-snug">{entry.product.name}</h3>
                <p className="mt-1 text-sm font-medium tabular">{inr(entry.product.price)}</p>

                <div className="mt-3">
                  <ScoreBar score={entry.score} label="Versatility score" />
                </div>

                <p className="mt-3 text-[11px] leading-relaxed text-smoke">{entry.reason}</p>

                <div className="mt-3 flex items-center justify-between border-y border-ink/10 py-2.5">
                  <span className="text-[10px] uppercase tracking-[0.1em] text-smoke">New combinations</span>
                  <span className="text-sm font-medium">~{entry.newCombinations}</span>
                </div>

                {entry.matchedItems.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[9px] uppercase tracking-[0.12em] text-stone">Works with</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      {entry.matchedItems.map((item) => (
                        <div
                          key={item.id}
                          className="h-10 w-8 overflow-hidden bg-sand"
                          title={`${item.name} · ${item.color}`}
                        >
                          <SmartImage src={item.image} alt={item.name} label={item.name} />
                        </div>
                      ))}
                      <span className="ml-1 text-[10px] text-stone">
                        {entry.matchedItems.length} piece{entry.matchedItems.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                )}

                <p className="mt-3 text-[10px] leading-relaxed text-stone">
                  Try: {entry.exampleCombination.join(" + ")}
                </p>

                <details className="mt-3 text-[10px] text-smoke">
                  <summary className="flex cursor-pointer items-center gap-1.5 uppercase tracking-[0.1em]">
                    <Info className="h-3 w-3" /> How the score is built
                  </summary>
                  <ul className="mt-2 space-y-1">
                    {entry.scoreBreakdown.map((part) => (
                      <li key={part.label} className="flex items-center justify-between gap-2">
                        <span>{part.label}</span>
                        <span className="tabular">
                          {part.value}/{part.max}
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>

                <div className="mt-auto grid grid-cols-[1fr_auto] gap-2 pt-4">
                  <Link
                    href={`/product/${entry.product.slug}`}
                    className="btn-secondary py-2.5 text-[10px]"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" /> View product
                  </Link>
                  <Link
                    href={`/go/${entry.product.id}?source=closet-missing`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center border border-ink/15 transition-colors hover:border-ink"
                    aria-label={`Shop ${entry.product.name} at ${entry.product.retailer}`}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 border border-dashed border-ink/15 bg-cream/40 px-6 py-14 text-center">
          <p className="font-display text-xl">No clear gaps left</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-smoke">
            Your wardrobe already covers the main slots. Adding colour or a statement layer would create
            variety, but nothing here is essential.
          </p>
        </div>
      )}

      <p className="mt-8 border-t border-ink/10 pt-5 text-[10px] leading-relaxed text-stone">
        Combination counts are estimates from pairing rules (category, colour harmony, season and style).
        They are not AI predictions, and prices are indicative. WearWise earns a commission on retailer
        links — never on your wardrobe data.
      </p>

      {loading && (
        <p className="mt-4 flex items-center gap-2 text-[11px] text-smoke">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Re-checking your wardrobe…
        </p>
      )}
    </div>
  );
}
