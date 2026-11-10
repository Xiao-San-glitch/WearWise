"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Loader2, RefreshCw, Sparkles, Wallet } from "lucide-react";
import type { BudgetPlan, WardrobeItem } from "@/lib/types";
import { inr } from "@/lib/format";
import { EmptyState } from "../ui";
import { SmartImage } from "../smart-image";
import { Panel, ScoreBar, StatusNote } from "./closet-shared";

const PRESETS = [500, 1000, 2000, 5000];

export function BudgetOptimizer({
  items,
  onAddPieces,
}: {
  items: WardrobeItem[];
  onAddPieces: () => void;
}) {
  const [budget, setBudget] = useState("2000");
  const [plan, setPlan] = useState<BudgetPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyse = useCallback(async (value: string) => {
    const numeric = Math.round(Number(value));
    if (!Number.isFinite(numeric) || numeric < 100) {
      setError("Enter a budget of at least ₹100.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/wardrobe/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "budget", budget: numeric }),
      });
      const data = (await response.json()) as { plan?: BudgetPlan; error?: string };
      if (!response.ok || !data.plan) {
        setError(data.error ?? "Could not build a plan.");
        return;
      }
      setPlan(data.plan);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (items.length) void analyse("2000");
  }, [analyse, items.length]);

  if (!items.length) {
    return (
      <EmptyState
        icon={<Wallet className="h-8 w-8" />}
        title="Your budget plan needs a wardrobe"
        description="We avoid recommending what you already own, so add a few pieces first. Then tell us your budget and we'll pick the purchases that create the most new outfits."
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
      <div className="max-w-2xl">
        <h2 className="font-display text-2xl">Spend where it counts</h2>
        <p className="mt-1 text-sm leading-relaxed text-smoke">
          Enter a budget. We compare catalogue pieces against your wardrobe, avoid anything you already
          own, and pick the combination that creates the most new outfits per rupee.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Panel title="Shopping budget" className="h-fit lg:sticky lg:top-24">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void analyse(budget);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setBudget(String(preset));
                    void analyse(String(preset));
                  }}
                  className={`border px-3 py-3 text-[11px] uppercase tracking-[0.1em] transition-colors ${
                    Number(budget) === preset
                      ? "border-ink bg-ink text-cream"
                      : "border-ink/15 text-graphite hover:border-ink"
                  }`}
                >
                  {inr(preset)}
                </button>
              ))}
            </div>

            <div>
              <label htmlFor="budget-input" className="field-label">
                Custom budget (₹)
              </label>
              <input
                id="budget-input"
                type="number"
                inputMode="numeric"
                min={100}
                max={200000}
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
                className="input"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-[10px]">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {loading ? "Optimising…" : "Optimise my budget"}
            </button>
          </form>
          <p className="mt-4 border-t border-ink/10 pt-4 text-[10px] leading-relaxed text-stone">
            Prices are indicative. WearWise does not process payments — links open the retailer&apos;s site.
          </p>
        </Panel>

        <div className="min-w-0">
          {error && (
            <div className="mb-4">
              <StatusNote kind="error">{error}</StatusNote>
            </div>
          )}

          {loading && !plan ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[0, 1].map((index) => (
                <div key={index} className="animate-pulse border border-ink/10 p-4">
                  <div className="h-24 bg-sand" />
                  <div className="mt-3 h-3 w-2/3 bg-sand" />
                  <div className="mt-2 h-3 w-full bg-sand" />
                </div>
              ))}
            </div>
          ) : plan ? (
            <>
              <div className="grid gap-px border border-ink/15 bg-ink/15 sm:grid-cols-3">
                <div className="bg-paper p-4">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-smoke">Budget</p>
                  <p className="mt-1 font-display text-2xl tabular">{inr(plan.budget)}</p>
                </div>
                <div className="bg-paper p-4">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-smoke">Plan total</p>
                  <p className="mt-1 font-display text-2xl tabular">{inr(plan.total)}</p>
                </div>
                <div className="bg-paper p-4">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-smoke">Remaining</p>
                  <p className="mt-1 font-display text-2xl tabular">{inr(plan.remaining)}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border border-ink/10 bg-cream p-4">
                <p className="max-w-xl text-[12px] leading-relaxed text-graphite">{plan.explanation}</p>
                <button
                  onClick={() => analyse(budget)}
                  disabled={loading}
                  className="btn-secondary py-2.5 text-[10px]"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
                </button>
              </div>

              {plan.picks.length ? (
                <div className="mt-4 space-y-3">
                  {plan.picks.map((pick, index) => (
                    <article key={pick.product.id} className="border border-ink/10 bg-paper p-3 sm:p-4">
                      <div className="flex gap-3 sm:gap-4">
                        <div className="h-28 w-20 shrink-0 overflow-hidden bg-sand sm:h-32 sm:w-24">
                          <SmartImage
                            src={pick.product.image}
                            alt={pick.product.name}
                            label={pick.product.name}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[9px] uppercase tracking-[0.12em] text-smoke">
                                Pick {index + 1} · {pick.product.brand} · suggested{" "}
                                {pick.suggestedColor.toLowerCase()}
                              </p>
                              <h3 className="mt-1 font-display text-lg leading-snug">{pick.product.name}</h3>
                            </div>
                            <span className="shrink-0 text-sm font-medium tabular">{inr(pick.product.price)}</span>
                          </div>

                          <div className="mt-2 max-w-xs">
                            <ScoreBar score={pick.score} label="Versatility" />
                          </div>

                          <p className="mt-2 text-[11px] leading-relaxed text-smoke">{pick.reason}</p>

                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-stone">
                            <span>~{pick.newCombinations} new combinations</span>
                            <span>Running total {inr(pick.runningTotal)}</span>
                            <span>{pick.matchedItems.length} matching pieces</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-ink/10 pt-3">
                        <p className="line-clamp-1 pr-4 text-[10px] text-stone">
                          Try: {pick.exampleCombination.join(" + ")}
                        </p>
                        <div className="flex shrink-0 items-center gap-2">
                          <Link href={`/product/${pick.product.slug}`} className="text-[10px] uppercase tracking-[0.12em] underline underline-offset-2">
                            View
                          </Link>
                          <Link
                            href={`/go/${pick.product.id}?source=closet-budget`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-8 w-8 items-center justify-center border border-ink/15 transition-colors hover:border-ink"
                            aria-label={`Shop ${pick.product.name}`}
                          >
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-4 border border-dashed border-ink/15 bg-cream/40 px-6 py-12 text-center">
                  <p className="font-display text-xl">Nothing fits this budget</p>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-smoke">
                    Try a slightly higher budget, or add more wardrobe pieces so cheaper items become
                    genuinely useful.
                  </p>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
