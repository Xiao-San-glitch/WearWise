"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Loader2, Sparkles, Wand2 } from "lucide-react";
import { cn, inr } from "@/lib/format";
import { colorToHex } from "./product-card";

const AUDIENCES = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "unisex", label: "Unisex" },
];

const BUDGETS = [
  { value: "500-1000", label: "₹500 – ₹1,000", hint: "Essentials" },
  { value: "1000-2000", label: "₹1,000 – ₹2,000", hint: "Everyday" },
  { value: "2000-5000", label: "₹2,000 – ₹5,000", hint: "Full look" },
  { value: "5000+", label: "₹5,000+", hint: "Occasion" },
];

const OCCASIONS = ["College", "Casual", "Party", "Wedding", "Office", "Date", "Travel"];
const STYLES = ["Streetwear", "Minimalist", "Old Money", "Casual", "Formal", "Sporty", "Traditional", "Aesthetic"];
const SEASONS = ["Summer", "Monsoon", "Winter", "All-season"];
const CATEGORIES = ["T-Shirts", "Shirts", "Jeans", "Trousers", "Hoodies", "Jackets", "Dresses", "Shoes", "Accessories", "Ethnic Wear"];
const FITS = ["Slim", "Regular", "Oversized"];
const COLORS = ["Black", "White", "Cream", "Beige", "Grey", "Navy", "Blue", "Indigo", "Olive", "Wine", "Tan", "Green"];

const STORAGE = "wearwise:brief";

interface Brief {
  audience: string;
  budget: string;
  customBudget: string;
  occasion: string;
  style: string;
  colors: string[];
  season: string;
  categories: string[];
  fit: string;
  instructions: string;
}

const INITIAL: Brief = {
  audience: "women",
  budget: "2000-5000",
  customBudget: "",
  occasion: "Date",
  style: "Minimalist",
  colors: ["Cream", "Black"],
  season: "All-season",
  categories: [],
  fit: "",
  instructions: "",
};

function Chip({
  active,
  children,
  onClick,
  className,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 border px-3.5 py-2 text-[11px] uppercase tracking-[0.1em] transition-colors",
        active
          ? "border-ink bg-ink text-cream"
          : "border-ink/20 text-graphite hover:border-ink",
        className,
      )}
    >
      {children}
      {active && <Check className="h-3 w-3" />}
    </button>
  );
}

export function StylistForm({ aiConfigured }: { aiConfigured: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [brief, setBrief] = useState<Brief>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE);
      const piece = searchParams.get("piece");
      if (saved) {
        setBrief({ ...INITIAL, ...(JSON.parse(saved) as Partial<Brief>) });
      }
      if (piece) {
        setBrief((prev) => ({ ...prev, instructions: `Style an outfit around the ${piece}.` }));
      }
    } catch {
      /* ignore */
    }
  }, [searchParams]);

  const progress = useMemo(() => {
    let score = 0;
    if (brief.audience) score += 1;
    if (brief.budget) score += 1;
    if (brief.occasion) score += 1;
    if (brief.style) score += 1;
    if (brief.colors.length) score += 1;
    if (brief.season) score += 1;
    return Math.round((score / 6) * 100);
  }, [brief]);

  function update<K extends keyof Brief>(key: K, value: Brief[K]) {
    setBrief((prev) => ({ ...prev, [key]: value }));
  }

  function toggleFromList(key: "colors" | "categories", value: string) {
    setBrief((prev) => {
      const list = prev[key];
      return {
        ...prev,
        [key]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value],
      };
    });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    window.localStorage.setItem(STORAGE, JSON.stringify(brief));

    try {
      const response = await fetch("/api/ai/stylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audience: brief.audience,
          budget: brief.customBudget ? undefined : brief.budget,
          customBudget: brief.customBudget ? Number(brief.customBudget) : undefined,
          occasion: brief.occasion,
          style: brief.style,
          colors: brief.colors,
          season: brief.season,
          categories: brief.categories,
          fit: brief.fit.toLowerCase(),
          instructions: brief.instructions,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "The stylist couldn't build that look. Try again.");
        setLoading(false);
        return;
      }
      window.sessionStorage.setItem("wearwise:stylist", JSON.stringify(data));
      router.push("/ai-stylist/results");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  const steps = [
    {
      label: "Occasion & style",
      done: Boolean(brief.occasion && brief.style),
    },
    { label: "Budget", done: Boolean(brief.budget || brief.customBudget) },
    { label: "Colours & fit", done: brief.colors.length > 0 },
  ];

  return (
    <form onSubmit={submit} className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14">
      <div className="space-y-10">
        {/* Step 1 */}
        <section>
          <div className="flex items-baseline gap-3">
            <span className="font-display text-2xl text-stone">01</span>
            <h2 className="font-display text-2xl">Who are we styling?</h2>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {AUDIENCES.map((audience) => (
              <Chip
                key={audience.value}
                active={brief.audience === audience.value}
                onClick={() => update("audience", audience.value)}
                className="min-w-[96px] justify-center py-3"
              >
                {audience.label}
              </Chip>
            ))}
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="field-label">Occasion</p>
              <div className="flex flex-wrap gap-1.5">
                {OCCASIONS.map((occasion) => (
                  <Chip
                    key={occasion}
                    active={brief.occasion === occasion}
                    onClick={() => update("occasion", occasion)}
                  >
                    {occasion}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="field-label">Style direction</p>
              <div className="flex flex-wrap gap-1.5">
                {STYLES.map((style) => (
                  <Chip
                    key={style}
                    active={brief.style === style}
                    onClick={() => update("style", style)}
                  >
                    {style}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Step 2 */}
        <section className="border-t border-ink/10 pt-8">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-2xl text-stone">02</span>
            <h2 className="font-display text-2xl">What&apos;s the budget?</h2>
          </div>
          <p className="mt-2 max-w-lg text-xs leading-relaxed text-smoke">
            This is the total for the complete outfit — we never assemble a look that goes over it.
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {BUDGETS.map((budget) => (
              <button
                key={budget.value}
                type="button"
                onClick={() => {
                  update("budget", budget.value);
                  update("customBudget", "");
                }}
                className={cn(
                  "flex items-baseline justify-between border px-4 py-3.5 text-left transition-colors",
                  brief.budget === budget.value && !brief.customBudget
                    ? "border-ink bg-ink text-cream"
                    : "border-ink/15 hover:border-ink",
                )}
              >
                <span className="text-sm">{budget.label}</span>
                <span
                  className={cn(
                    "text-[10px] uppercase tracking-[0.12em]",
                    brief.budget === budget.value && !brief.customBudget ? "text-cream/60" : "text-stone",
                  )}
                >
                  {budget.hint}
                </span>
              </button>
            ))}
          </div>

          <label className="mt-3 block max-w-xs">
            <span className="field-label">Or set a custom budget (₹)</span>
            <input
              inputMode="numeric"
              value={brief.customBudget}
              onChange={(event) => update("customBudget", event.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 3500"
              className="input"
            />
          </label>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="field-label">Season / weather</p>
              <div className="flex flex-wrap gap-1.5">
                {SEASONS.map((season) => (
                  <Chip key={season} active={brief.season === season} onClick={() => update("season", season)}>
                    {season}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="field-label">Body fit (optional)</p>
              <div className="flex flex-wrap gap-1.5">
                {FITS.map((fit) => (
                  <Chip
                    key={fit}
                    active={brief.fit === fit}
                    onClick={() => update("fit", brief.fit === fit ? "" : fit)}
                  >
                    {fit}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Step 3 */}
        <section className="border-t border-ink/10 pt-8">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-2xl text-stone">03</span>
            <h2 className="font-display text-2xl">The details</h2>
          </div>

          <div className="mt-5">
            <p className="field-label">Preferred colours</p>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => {
                const active = brief.colors.includes(color);
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => toggleFromList("colors", color)}
                    aria-pressed={active}
                    className={cn(
                      "flex items-center gap-2 border py-1.5 pl-1.5 pr-3 text-[11px] transition-colors",
                      active ? "border-ink" : "border-ink/15 hover:border-ink/40",
                    )}
                  >
                    <span
                      className="h-5 w-5 rounded-full border border-ink/15"
                      style={{ backgroundColor: colorToHex(color) }}
                    />
                    {color}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6">
            <p className="field-label">Preferred categories (optional)</p>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((category) => (
                <Chip
                  key={category}
                  active={brief.categories.includes(category)}
                  onClick={() => toggleFromList("categories", category)}
                >
                  {category}
                </Chip>
              ))}
            </div>
          </div>

          <label className="mt-6 block">
            <span className="field-label">Anything else? (optional)</span>
            <textarea
              value={brief.instructions}
              onChange={(event) => update("instructions", event.target.value)}
              rows={3}
              maxLength={400}
              placeholder="e.g. I have a broad build, prefer no logos, and need it to work with white sneakers."
              className="input resize-none"
            />
          </label>
        </section>

        {error && (
          <p className="border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</p>
        )}
      </div>

      {/* Sticky brief */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="border border-ink/10 bg-cream p-6">
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            <p className="text-[10px] uppercase tracking-[0.16em]">Your brief</p>
          </div>

          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-ink/10 pb-2.5">
              <span className="text-smoke">Shopping for</span>
              <span className="text-right">{AUDIENCES.find((a) => a.value === brief.audience)?.label}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-ink/10 pb-2.5">
              <span className="text-smoke">Occasion</span>
              <span className="text-right">{brief.occasion}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-ink/10 pb-2.5">
              <span className="text-smoke">Style</span>
              <span className="text-right">{brief.style}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-ink/10 pb-2.5">
              <span className="text-smoke">Budget</span>
              <span className="text-right">
                {brief.customBudget
                  ? `Up to ${inr(Number(brief.customBudget) || 0)}`
                  : BUDGETS.find((b) => b.value === brief.budget)?.label}
              </span>
            </div>
            <div className="flex justify-between gap-4 border-b border-ink/10 pb-2.5">
              <span className="text-smoke">Fit</span>
              <span className="text-right">{brief.fit || "Any"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-smoke">Colours</span>
              <span className="text-right">{brief.colors.join(", ") || "Any"}</span>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-smoke">
              <span>Brief completeness</span>
              <span>{progress}%</span>
            </div>
            <div className="mt-2 h-[3px] w-full bg-ink/10">
              <div className="h-full bg-ink transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <ul className="mt-3 space-y-1.5">
              {steps.map((item) => (
                <li key={item.label} className="flex items-center gap-2 text-[11px] text-smoke">
                  <Check className={cn("h-3 w-3", item.done ? "text-emerald-700" : "text-stone/50")} />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>

          <button type="submit" className="btn-primary mt-6 w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Styling your look…
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" /> Generate my looks
              </>
            )}
          </button>

          <p className="mt-3 text-[10px] leading-relaxed text-stone">
            {aiConfigured
              ? "Live AI styling is active. Every product comes from the WearWise catalogue."
              : "Currently using the built-in styling engine. Add a GEMINI_API_KEY to enable live AI — results stay fully functional either way."}
          </p>
        </div>

        <div className="mt-4 flex items-start gap-3 border border-ink/10 p-4">
          <Sparkles className="mt-0.5 h-4 w-4 text-smoke" />
          <p className="text-[11px] leading-relaxed text-smoke">
            Prefer to ask a question?{" "}
            <a href="/ai-stylist/assistant" className="text-ink underline underline-offset-2">
              Talk to the AI assistant
            </a>{" "}
            about colours, occasions or specific pieces.
          </p>
        </div>
      </aside>
    </form>
  );
}
