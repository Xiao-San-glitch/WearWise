"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Heart,
  Loader2,
  RefreshCw,
  Repeat2,
  Save,
  Shuffle,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";
import type { GeneratedWardrobeOutfit, WardrobeItem, WardrobePreferences } from "@/lib/types";
import { inr } from "@/lib/format";
import { OUTFIT_TYPES, WARDROBE_COLORS, WARDROBE_OCCASIONS, WARDROBE_SEASONS, WARDROBE_STYLES, slotOf } from "@/lib/wardrobe";
import { SmartImage } from "../smart-image";
import { Panel, ScoreBar, Spinner, StatusNote } from "./closet-shared";

const DEFAULT_PREFS: WardrobePreferences = {
  occasion: "Casual",
  style: "Minimal",
  color: "Any",
  season: "All-season",
  audience: "Any",
  outfitType: "complete",
};

export function OutfitStudio({
  items,
  onSaved,
  notify,
  onAddPieces,
}: {
  items: WardrobeItem[];
  onSaved: () => Promise<void> | void;
  notify: (message: string) => void;
  onAddPieces: () => void;
}) {
  const [prefs, setPrefs] = useState<WardrobePreferences>(DEFAULT_PREFS);
  const [outfits, setOutfits] = useState<GeneratedWardrobeOutfit[]>([]);
  const [gaps, setGaps] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedMap, setSavedMap] = useState<Record<string, string>>({});
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [busyId, setBusyId] = useState("");
  const [replaceTarget, setReplaceTarget] = useState<{ outfitIndex: number; itemId: string } | null>(null);
  const [builder, setBuilder] = useState<{ outfitIndex: number } | null>(null);
  const autoRan = useRef(false);

  async function generate(payload: WardrobePreferences, seed?: number) {
    setLoading(true);
    setError("");
    setSavedMap({});
    setFavorites({});
    try {
      const response = await fetch("/api/wardrobe/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: payload, seed: seed ?? 1 }),
      });
      const data = (await response.json()) as {
        outfits?: GeneratedWardrobeOutfit[];
        gaps?: string[];
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "Could not generate outfits.");
        setOutfits([]);
        return;
      }
      setOutfits(data.outfits ?? []);
      setGaps(data.gaps ?? []);
      if (!data.outfits?.length) {
        setError("We couldn't build a complete outfit from these pieces yet.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (autoRan.current || items.length < 2) return;
    autoRan.current = true;
    void generate(DEFAULT_PREFS, 7);
  }, [items.length]);

  async function saveOutfit(outfit: GeneratedWardrobeOutfit, favorite = false) {
    setBusyId(outfit.id);
    setError("");
    try {
      const response = await fetch("/api/wardrobe/outfits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: outfit.title,
          description: outfit.description,
          itemIds: outfit.itemIds,
          occasion: outfit.occasion,
          style: outfit.style,
          season: outfit.season,
          why: outfit.why,
          suitability: outfit.suitability,
          tips: outfit.tips,
          favorite,
        }),
      });
      const data = (await response.json()) as { outfit?: { id: string }; error?: string };
      if (!response.ok || !data.outfit) {
        setError(data.error ?? "Could not save this outfit.");
        return;
      }
      setSavedMap((prev) => ({ ...prev, [outfit.id]: data.outfit!.id }));
      setFavorites((prev) => ({ ...prev, [outfit.id]: favorite }));
      notify("Outfit saved to your closet");
      await onSaved();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusyId("");
    }
  }

  async function toggleFavorite(outfit: GeneratedWardrobeOutfit) {
    const savedId = savedMap[outfit.id];
    if (!savedId) {
      await saveOutfit(outfit, true);
      return;
    }
    const next = !favorites[outfit.id];
    setBusyId(outfit.id);
    try {
      const response = await fetch(`/api/wardrobe/outfits/${savedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: next }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        notify(data.error ?? "Could not update favourite");
        return;
      }
      setFavorites((prev) => ({ ...prev, [outfit.id]: next }));
      notify(next ? "Added to favourites" : "Removed from favourites");
      await onSaved();
    } catch {
      notify("Network error. Please try again.");
    } finally {
      setBusyId("");
    }
  }

  async function replaceItem(outfit: GeneratedWardrobeOutfit, replacement: WardrobeItem) {
    setBusyId(outfit.id);
    setError("");
    try {
      const response = await fetch("/api/wardrobe/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: outfit.itemIds,
          itemId: replaceTarget?.itemId,
          replacementId: replacement.id,
          preferences: prefs,
        }),
      });
      const data = (await response.json()) as {
        item?: WardrobeItem;
        items?: string[];
        total?: number;
        score?: number;
        description?: string;
        why?: string;
        suitability?: string;
        tips?: string;
        error?: string;
      };
      if (!response.ok || !data.item || !data.items) {
        setError(data.error ?? "Could not swap that piece.");
        return;
      }
      setOutfits((prev) =>
        prev.map((entry) =>
          entry.id === outfit.id
            ? {
                ...entry,
                items: entry.items.map((item) => (item.id === replaceTarget?.itemId ? data.item! : item)),
                itemIds: data.items!,
                total: data.total ?? entry.total,
                score: data.score ?? entry.score,
                description: data.description ?? entry.description,
                why: data.why ?? entry.why,
                suitability: data.suitability ?? entry.suitability,
                tips: data.tips ?? entry.tips,
              }
            : entry,
        ),
      );
      setReplaceTarget(null);
      notify(`${replacement.name} swapped in`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusyId("");
    }
  }

  const targetOutfit = replaceTarget ? outfits[replaceTarget.outfitIndex] : null;
  const targetItem = targetOutfit?.items.find((item) => item.id === replaceTarget?.itemId);
  const alternatives = useMemo(() => {
    if (!targetOutfit || !targetItem) return [];
    const slot = slotOf(targetItem.category);
    return items.filter((item) => slotOf(item.category) === slot && !targetOutfit.itemIds.includes(item.id));
  }, [items, targetOutfit, targetItem]);

  if (!items.length) {
    return (
      <div className="border border-dashed border-ink/15 bg-cream/40 px-6 py-16 text-center">
        <Sparkles className="mx-auto h-7 w-7 text-stone" />
        <h2 className="mt-4 font-display text-2xl">Build outfits from what you own</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-smoke">
          Add a few pieces to your wardrobe first. The generator only uses real items you own — it never
          invents products.
        </p>
        <button onClick={onAddPieces} className="btn-primary mt-6 py-2.5 text-[10px]">
          Add wardrobe pieces <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Panel
          title="Brief the stylist"
          description={`Using ${items.length} real pieces from your closet.`}
          className="h-fit lg:sticky lg:top-24"
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void generate(prefs, Date.now());
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="outfit-occasion" className="field-label">
                Occasion
              </label>
              <select
                id="outfit-occasion"
                value={prefs.occasion}
                onChange={(event) => setPrefs({ ...prefs, occasion: event.target.value })}
                className="input"
              >
                {WARDROBE_OCCASIONS.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="outfit-style" className="field-label">
                Style
              </label>
              <select
                id="outfit-style"
                value={prefs.style}
                onChange={(event) => setPrefs({ ...prefs, style: event.target.value })}
                className="input"
              >
                {WARDROBE_STYLES.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="outfit-colour" className="field-label">
                  Preferred colour
                </label>
                <select
                  id="outfit-colour"
                  value={prefs.color}
                  onChange={(event) => setPrefs({ ...prefs, color: event.target.value })}
                  className="input"
                >
                  <option value="Any">Any</option>
                  {WARDROBE_COLORS.map((entry) => (
                    <option key={entry} value={entry}>
                      {entry}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="outfit-season" className="field-label">
                  Season
                </label>
                <select
                  id="outfit-season"
                  value={prefs.season}
                  onChange={(event) => setPrefs({ ...prefs, season: event.target.value })}
                  className="input"
                >
                  {WARDROBE_SEASONS.map((entry) => (
                    <option key={entry} value={entry}>
                      {entry}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="outfit-audience" className="field-label">
                Fit preference
              </label>
              <select
                id="outfit-audience"
                value={prefs.audience}
                onChange={(event) =>
                  setPrefs({ ...prefs, audience: event.target.value as WardrobePreferences["audience"] })
                }
                className="input"
              >
                <option value="Any">Any / unisex</option>
                <option value="Men">Men</option>
                <option value="Women">Women</option>
              </select>
            </div>

            <div>
              <label htmlFor="outfit-type" className="field-label">
                Outfit type
              </label>
              <div className="relative">
                <select
                  id="outfit-type"
                  value={prefs.outfitType}
                  onChange={(event) =>
                    setPrefs({ ...prefs, outfitType: event.target.value as WardrobePreferences["outfitType"] })
                  }
                  className="input appearance-none pr-9"
                >
                  {OUTFIT_TYPES.map((entry) => (
                    <option key={entry.value} value={entry.value}>
                      {entry.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
              </div>
              <p className="mt-1.5 text-[10px] text-stone">
                {OUTFIT_TYPES.find((entry) => entry.value === prefs.outfitType)?.hint}
              </p>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-[10px]">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {loading ? "Building looks…" : "Generate outfits"}
            </button>
          </form>

          <p className="mt-4 border-t border-ink/10 pt-4 text-[10px] leading-relaxed text-stone">
            Generation is rule-based: it scores real combinations against the occasion, style, colour and
            season you choose. Scores are estimates, not AI predictions.
          </p>
        </Panel>

        <div className="min-w-0">
          {error && (
            <div className="mb-4">
              <StatusNote kind="error">{error}</StatusNote>
            </div>
          )}

          {gaps.length > 0 && (
            <div className="mb-4 border border-clay/20 bg-clay/5 p-4">
              <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-clay">
                <TriangleAlert className="h-3.5 w-3.5" /> Wardrobe gaps
              </p>
              <ul className="mt-2 space-y-1 text-[11px] leading-relaxed text-graphite">
                {gaps.slice(0, 3).map((gap) => (
                  <li key={gap}>· {gap}</li>
                ))}
              </ul>
            </div>
          )}

          {loading && !outfits.length ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {[0, 1].map((index) => (
                <div key={index} className="animate-pulse border border-ink/10 bg-paper">
                  <div className="aspect-[4/3] bg-sand" />
                  <div className="space-y-3 p-5">
                    <div className="h-3 w-1/3 bg-sand" />
                    <div className="h-5 w-2/3 bg-sand" />
                    <div className="h-3 w-full bg-sand" />
                    <div className="h-3 w-4/5 bg-sand" />
                  </div>
                </div>
              ))}
            </div>
          ) : outfits.length ? (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-smoke">
                  {outfits.length} looks · {prefs.occasion} · {prefs.style}
                </p>
                <button
                  onClick={() => generate(prefs, Date.now())}
                  disabled={loading}
                  className="btn-secondary py-2.5 text-[10px]"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Regenerate
                </button>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {outfits.map((outfit, index) => {
                  const saved = Boolean(savedMap[outfit.id]);
                  const isFavorite = favorites[outfit.id];
                  return (
                    <article key={`${outfit.id}-${index}`} className="flex flex-col border border-ink/10 bg-paper">
                      <div className="flex items-stretch gap-px bg-ink/10">
                        {outfit.items.slice(0, 4).map((item, itemIndex) => (
                          <div
                            key={item.id}
                            className={`relative overflow-hidden bg-sand ${
                              itemIndex === 0 ? "aspect-[3/4] flex-[1.5]" : "aspect-[3/4] flex-1"
                            }`}
                          >
                            <SmartImage src={item.image} alt={item.name} label={item.name} />
                            <span className="absolute bottom-1.5 left-1.5 bg-paper/90 px-1.5 py-0.5 text-[8px] uppercase tracking-[0.08em]">
                              {item.category}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-1 flex-col p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-[0.16em] text-smoke">Look {index + 1}</p>
                            <h3 className="mt-1 font-display text-xl leading-snug">{outfit.title}</h3>
                          </div>
                          <button
                            onClick={() => toggleFavorite(outfit)}
                            disabled={busyId === outfit.id}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/15 transition-colors hover:border-ink disabled:opacity-50"
                            aria-label={isFavorite ? "Remove from favourites" : "Favourite this outfit"}
                          >
                            <Heart className={`h-4 w-4 ${isFavorite ? "fill-clay text-clay" : "text-ink"}`} />
                          </button>
                        </div>

                        <p className="mt-2 text-[12px] leading-relaxed text-graphite">{outfit.description}</p>

                        <div className="mt-3">
                          <ScoreBar score={outfit.score} label="Wardrobe match" />
                        </div>

                        <p className="mt-3 text-[11px] leading-relaxed text-smoke">{outfit.why}</p>

                        <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
                          {outfit.items.map((item) => (
                            <li key={item.id} className="flex items-center justify-between gap-2 py-2">
                              <div className="min-w-0">
                                <p className="truncate text-[12px]">{item.name}</p>
                                <p className="text-[9px] uppercase tracking-[0.1em] text-stone">
                                  {item.color} · {item.category}
                                  {item.size ? ` · ${item.size}` : ""}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <span className="text-[11px] tabular">{inr(item.price)}</span>
                                <button
                                  onClick={() => setReplaceTarget({ outfitIndex: index, itemId: item.id })}
                                  className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 text-smoke transition-colors hover:border-ink hover:text-ink"
                                  aria-label={`Replace ${item.name}`}
                                >
                                  <Repeat2 className="h-3 w-3" />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>

                        <div className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-smoke">
                          <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-700" />
                          <span>{outfit.suitability}</span>
                        </div>

                        <div className="mt-3 border-l-2 border-ink/20 pl-3">
                          <p className="text-[9px] uppercase tracking-[0.12em] text-smoke">Styling tip</p>
                          <p className="mt-1 text-[11px] leading-relaxed text-graphite">{outfit.tips}</p>
                        </div>

                        <div className="mt-auto pt-4">
                          <div className="flex items-center justify-between border-t border-ink/10 py-3">
                            <span className="text-[10px] uppercase tracking-[0.12em] text-smoke">
                              Estimated value
                            </span>
                            <span className="font-display text-lg tabular">{inr(outfit.total)}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => saveOutfit(outfit)}
                              disabled={saved || busyId === outfit.id}
                              className="btn-primary py-2.5 text-[10px]"
                            >
                              {busyId === outfit.id ? <Spinner /> : <Save className="h-3.5 w-3.5" />}
                              {saved ? "Saved" : "Save look"}
                            </button>
                            <button
                              onClick={() => setBuilder({ outfitIndex: index })}
                              className="btn-secondary py-2.5 text-[10px]"
                            >
                              <Shuffle className="h-3.5 w-3.5" /> Mix & match
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="border border-dashed border-ink/15 bg-cream/40 px-6 py-16 text-center">
              <Sparkles className="mx-auto h-7 w-7 text-stone" />
              <h3 className="mt-4 font-display text-2xl">Ready when you are</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-smoke">
                Choose an occasion and style, then generate. We&apos;ll build looks only from the{" "}
                {items.length} pieces in your closet.
              </p>
            </div>
          )}
        </div>
      </div>

      {targetOutfit && targetItem && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-ink/50 p-3 backdrop-blur-sm sm:p-6">
          <button className="fixed inset-0 cursor-default" aria-label="Close" onClick={() => setReplaceTarget(null)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Replace ${targetItem.name}`}
            className="relative my-6 w-full max-w-lg border border-ink/10 bg-paper shadow-lift"
          >
            <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-smoke">Swap a piece</p>
                <h3 className="mt-1 font-display text-xl">{targetItem.name}</h3>
              </div>
              <button onClick={() => setReplaceTarget(null)} className="btn-icon" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4">
              {alternatives.length ? (
                <div className="space-y-2">
                  {alternatives.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => replaceItem(targetOutfit, item)}
                      disabled={busyId === targetOutfit.id}
                      className="flex w-full items-center gap-3 border border-ink/10 p-2 text-left transition-colors hover:border-ink disabled:opacity-50"
                    >
                      <div className="h-16 w-12 shrink-0 overflow-hidden bg-sand">
                        <SmartImage src={item.image} alt={item.name} label={item.name} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px]">{item.name}</p>
                        <p className="text-[10px] uppercase tracking-[0.1em] text-smoke">
                          {item.color} · {item.category} {item.size ? `· ${item.size}` : ""}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] tabular">{inr(item.price)}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-2 py-8 text-center">
                  <p className="text-sm text-smoke">
                    No other {slotOf(targetItem.category)} in your wardrobe yet.
                  </p>
                  <button onClick={onAddPieces} className="btn-secondary mt-4 py-2.5 text-[10px]">
                    Add more pieces
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {builder && outfits[builder.outfitIndex] && (
        <MixAndMatchModal
          outfit={outfits[builder.outfitIndex]}
          items={items}
          onClose={() => setBuilder(null)}
          onSaved={async () => {
            setBuilder(null);
            await onSaved();
          }}
          notify={notify}
        />
      )}
    </div>
  );
}

function MixAndMatchModal({
  outfit,
  items,
  onClose,
  onSaved,
  notify,
}: {
  outfit: GeneratedWardrobeOutfit;
  items: WardrobeItem[];
  onClose: () => void;
  onSaved: () => Promise<void> | void;
  notify: (message: string) => void;
}) {
  const slots: { key: "top" | "bottom" | "layer" | "shoes" | "accessory"; label: string }[] = [
    { key: "top", label: "Top" },
    { key: "bottom", label: "Bottom" },
    { key: "shoes", label: "Shoes" },
    { key: "layer", label: "Layer" },
    { key: "accessory", label: "Accessory" },
  ];

  const [selection, setSelection] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const slot of slots) {
      initial[slot.key] = outfit.items.find((item) => slotOf(item.category) === slot.key)?.id ?? "";
    }
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const chosen = slots
    .map((slot) => items.find((item) => item.id === selection[slot.key]))
    .filter((item): item is WardrobeItem => Boolean(item));
  const total = chosen.reduce((sum, item) => sum + item.price, 0);

  async function save() {
    setError("");
    if (!selection.top || !selection.bottom) {
      setError("Choose at least a top and a bottom.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/wardrobe/outfits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Custom ${outfit.occasion} look`,
          description: "A look you assembled yourself from your wardrobe.",
          itemIds: chosen.map((item) => item.id),
          occasion: outfit.occasion,
          style: outfit.style,
          season: outfit.season,
          why: outfit.why,
          suitability: outfit.suitability,
          tips: outfit.tips,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not save this look.");
        return;
      }
      notify("Custom look saved");
      await onSaved();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-ink/50 p-3 backdrop-blur-sm sm:p-6">
      <button className="fixed inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Mix and match outfit"
        className="relative my-6 w-full max-w-2xl border border-ink/10 bg-paper shadow-lift"
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-smoke">Mix & match</p>
            <h3 className="mt-1 font-display text-xl">Build a custom look</h3>
          </div>
          <button onClick={onClose} className="btn-icon" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          {slots.map((slot) => {
            const options = items.filter((item) => slotOf(item.category) === slot.key);
            if (!options.length && slot.key !== "top" && slot.key !== "bottom") return null;
            return (
              <div key={slot.key}>
                <label htmlFor={`builder-${slot.key}`} className="field-label">
                  {slot.label}
                </label>
                <select
                  id={`builder-${slot.key}`}
                  value={selection[slot.key] ?? ""}
                  onChange={(event) => setSelection({ ...selection, [slot.key]: event.target.value })}
                  className="input"
                >
                  <option value="">None</option>
                  {options.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} · {inr(item.price)}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 px-5 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.12em] text-smoke">
              {chosen.length} pieces · estimated value
            </p>
            <p className="font-display text-xl tabular">{inr(total)}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary py-2.5 text-[10px]">
              Cancel
            </button>
            <button onClick={save} disabled={saving} className="btn-primary py-2.5 text-[10px]">
              {saving && <Spinner />} Save custom look
            </button>
          </div>
        </div>
        {error && (
          <div className="px-5 pb-5">
            <StatusNote kind="error">{error}</StatusNote>
          </div>
        )}
      </div>
    </div>
  );
}
