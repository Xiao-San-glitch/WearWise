"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  FolderPlus,
  Heart,
  Loader2,
  Plus,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import type { PlannerEntry, WardrobeCollection, WardrobeOutfitView } from "@/lib/types";
import { inr } from "@/lib/format";
import { EmptyState } from "../ui";
import { SmartImage } from "../smart-image";
import { Panel, StatusNote, upcomingDays } from "./closet-shared";

export function OutfitLibrary({
  outfits,
  collections,
  planner,
  onChanged,
  notify,
  onGenerate,
}: {
  outfits: WardrobeOutfitView[];
  collections: WardrobeCollection[];
  planner: PlannerEntry[];
  onChanged: () => Promise<void> | void;
  notify: (message: string) => void;
  onGenerate: () => void;
}) {
  const [filter, setFilter] = useState("All");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [planFor, setPlanFor] = useState<WardrobeOutfitView | null>(null);
  const [planDate, setPlanDate] = useState(upcomingDays(1)[0]?.iso ?? "");
  const [planning, setPlanning] = useState(false);

  const days = useMemo(() => upcomingDays(7), []);
  const usage = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of planner) {
      if (days.some((day) => day.iso === entry.date)) {
        counts.set(entry.outfitId, (counts.get(entry.outfitId) ?? 0) + 1);
      }
    }
    return counts;
  }, [planner, days]);

  const visible = useMemo(() => {
    if (filter === "All") return outfits;
    if (filter === "Favourites") return outfits.filter((outfit) => outfit.favorite);
    return outfits.filter((outfit) => outfit.collectionId === filter);
  }, [outfits, filter]);

  async function createCollection(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Give the collection a name.");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const response = await fetch("/api/wardrobe/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not create the collection.");
        return;
      }
      setName("");
      notify("Collection created");
      await onChanged();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  async function removeCollection(id: string) {
    setBusy(`collection-${id}`);
    setError("");
    try {
      const response = await fetch(`/api/wardrobe/collections?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setError(data.error ?? "Could not delete the collection.");
        return;
      }
      if (filter === id) setFilter("All");
      notify("Collection deleted — outfits kept");
      await onChanged();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy("");
    }
  }

  async function toggleFavorite(outfit: WardrobeOutfitView) {
    setBusy(`fav-${outfit.id}`);
    try {
      const response = await fetch(`/api/wardrobe/outfits/${outfit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: !outfit.favorite }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        notify(data.error ?? "Could not update favourite");
        return;
      }
      notify(outfit.favorite ? "Removed from favourites" : "Added to favourites");
      await onChanged();
    } catch {
      notify("Network error. Please try again.");
    } finally {
      setBusy("");
    }
  }

  async function assignCollection(outfit: WardrobeOutfitView, collectionId: string) {
    setBusy(`col-${outfit.id}`);
    try {
      const response = await fetch(`/api/wardrobe/outfits/${outfit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionId: collectionId || null }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        notify(data.error ?? "Could not move that outfit.");
        return;
      }
      notify(collectionId ? "Moved to collection" : "Removed from collection");
      await onChanged();
    } catch {
      notify("Network error. Please try again.");
    } finally {
      setBusy("");
    }
  }

  async function deleteOutfit(id: string) {
    setBusy(`del-${id}`);
    try {
      const response = await fetch(`/api/wardrobe/outfits/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        notify(data.error ?? "Could not delete that outfit.");
        return;
      }
      setPendingDelete(null);
      notify("Outfit deleted");
      await onChanged();
    } catch {
      notify("Network error. Please try again.");
    } finally {
      setBusy("");
    }
  }

  async function plan() {
    if (!planFor) return;
    setPlanning(true);
    setError("");
    try {
      const response = await fetch("/api/wardrobe/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: planDate, outfitId: planFor.id }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not plan that outfit.");
        return;
      }
      notify(`Planned for ${new Date(`${planDate}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`);
      setPlanFor(null);
      await onChanged();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPlanning(false);
    }
  }

  async function clearDay(iso: string) {
    setBusy(`day-${iso}`);
    try {
      const response = await fetch(`/api/wardrobe/planner?date=${encodeURIComponent(iso)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        notify("Could not clear that day.");
        return;
      }
      notify("Planner updated");
      await onChanged();
    } catch {
      notify("Network error. Please try again.");
    } finally {
      setBusy("");
    }
  }

  async function setDay(iso: string, outfitId: string) {
    if (!outfitId) {
      await clearDay(iso);
      return;
    }
    setBusy(`day-${iso}`);
    try {
      const response = await fetch("/api/wardrobe/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: iso, outfitId }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        notify(data.error ?? "Could not update the planner.");
        return;
      }
      await onChanged();
    } catch {
      notify("Network error. Please try again.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl">Saved outfits</h2>
            <p className="mt-1 text-sm text-smoke">
              {outfits.length} saved · {outfits.filter((outfit) => outfit.favorite).length} favourite
            </p>
          </div>
          <button onClick={onGenerate} className="btn-secondary py-2.5 text-[10px]">
            Generate another look
          </button>
        </div>

        {error && (
          <div className="mt-4">
            <StatusNote kind="error">{error}</StatusNote>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilter("All")}
            className={`chip ${filter === "All" ? "chip-active" : ""}`}
          >
            All <span className="tabular opacity-70">{outfits.length}</span>
          </button>
          <button
            onClick={() => setFilter("Favourites")}
            className={`chip ${filter === "Favourites" ? "chip-active" : ""}`}
          >
            <Heart className="h-3 w-3" /> Favourites
          </button>
          {collections.map((collection) => (
            <span key={collection.id} className="inline-flex items-center">
              <button
                onClick={() => setFilter(collection.id)}
                className={`chip rounded-r-none ${filter === collection.id ? "chip-active" : ""}`}
              >
                {collection.name}
              </button>
              <button
                onClick={() => removeCollection(collection.id)}
                disabled={busy === `collection-${collection.id}`}
                className={`flex h-[30px] items-center rounded-r-full border border-l-0 border-ink/15 px-2 text-stone transition-colors hover:text-clay ${
                  filter === collection.id ? "border-ink bg-ink" : ""
                }`}
                aria-label={`Delete ${collection.name} collection`}
              >
                {busy === `collection-${collection.id}` ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <X className="h-3 w-3" />
                )}
              </button>
            </span>
          ))}

          <form onSubmit={createCollection} className="ml-auto flex items-center gap-2">
            <label htmlFor="new-collection" className="sr-only">
              New collection name
            </label>
            <input
              id="new-collection"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={50}
              placeholder="New collection"
              className="w-36 border border-ink/15 bg-paper px-3 py-1.5 text-[11px] outline-none focus:border-ink"
            />
            <button
              type="submit"
              disabled={creating || !name.trim()}
              className="flex h-8 w-8 items-center justify-center border border-ink/15 transition-colors hover:border-ink disabled:opacity-40"
              aria-label="Create collection"
            >
              {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FolderPlus className="h-3.5 w-3.5" />}
            </button>
          </form>
        </div>

        {outfits.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={<Heart className="h-8 w-8" />}
              title="No saved outfits yet"
              description="Generate a look from your wardrobe and save it. Saved outfits can be favourited, grouped into collections and planned into your week."
              action={
                <button onClick={onGenerate} className="btn-primary py-2.5 text-[10px]">
                  <Plus className="h-3.5 w-3.5" /> Generate a look
                </button>
              }
            />
          </div>
        ) : visible.length === 0 ? (
          <p className="mt-6 border border-dashed border-ink/15 bg-cream/40 px-6 py-12 text-center text-sm text-smoke">
            Nothing in this view yet. Save a look or switch filters.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((outfit) => (
              <article key={outfit.id} className="flex flex-col border border-ink/10 bg-paper">
                <div className="flex gap-px bg-ink/10">
                  {outfit.items.slice(0, 4).map((item) => (
                    <div key={item.id} className="relative aspect-[3/4] flex-1 overflow-hidden bg-sand">
                      <SmartImage src={item.image} alt={item.name} label={item.name} />
                    </div>
                  ))}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[9px] uppercase tracking-[0.12em] text-smoke">
                        {outfit.occasion} · {outfit.style}
                      </p>
                      <h3 className="mt-1 font-display text-lg leading-snug">{outfit.title}</h3>
                    </div>
                    <button
                      onClick={() => toggleFavorite(outfit)}
                      disabled={busy === `fav-${outfit.id}`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ink/15 transition-colors hover:border-ink disabled:opacity-50"
                      aria-label={outfit.favorite ? "Remove from favourites" : "Add to favourites"}
                    >
                      <Heart className={`h-3.5 w-3.5 ${outfit.favorite ? "fill-clay text-clay" : ""}`} />
                    </button>
                  </div>

                  <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-smoke">
                    {outfit.items.map((item) => item.name).join(" · ")}
                  </p>

                  <div className="mt-3 flex items-center justify-between border-t border-ink/10 pt-2.5">
                    <span className="text-[10px] uppercase tracking-[0.1em] text-stone">Value</span>
                    <span className="text-sm font-medium tabular">{inr(outfit.total)}</span>
                  </div>

                  <select
                    value={outfit.collectionId ?? ""}
                    onChange={(event) => assignCollection(outfit, event.target.value)}
                    disabled={busy === `col-${outfit.id}` || collections.length === 0}
                    aria-label={`Collection for ${outfit.title}`}
                    className="mt-3 w-full border border-ink/15 bg-paper px-2.5 py-2 text-[11px] outline-none focus:border-ink disabled:opacity-50"
                  >
                    <option value="">No collection</option>
                    {collections.map((collection) => (
                      <option key={collection.id} value={collection.id}>
                        {collection.name}
                      </option>
                    ))}
                  </select>

                  <div className="mt-auto grid grid-cols-2 gap-2 pt-3">
                    <button
                      onClick={() => {
                        setPlanFor(outfit);
                        setPlanDate(days[0]?.iso ?? "");
                      }}
                      className="btn-secondary py-2 text-[9px]"
                    >
                      <CalendarDays className="h-3 w-3" /> Plan it
                    </button>
                    {pendingDelete === outfit.id ? (
                      <button
                        onClick={() => deleteOutfit(outfit.id)}
                        disabled={busy === `del-${outfit.id}`}
                        className="btn bg-clay px-3 py-2 text-[9px] text-cream hover:bg-ink"
                      >
                        {busy === `del-${outfit.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                        Confirm
                      </button>
                    ) : (
                      <button
                        onClick={() => setPendingDelete(outfit.id)}
                        className="btn-secondary py-2 text-[9px] text-smoke hover:text-ink"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <Panel
        title="Weekly outfit planner"
        description="Plan the next seven days from your saved looks. Repeats are flagged so you can rotate."
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {days.map((day) => {
            const entry = planner.find((item) => item.date === day.iso);
            const outfit = entry ? outfits.find((item) => item.id === entry.outfitId) : undefined;
            const repeated = entry ? (usage.get(entry.outfitId) ?? 0) > 1 : false;
            return (
              <div key={day.iso} className="border border-ink/10 bg-paper p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.12em] text-stone">{day.day}</p>
                    <p className="text-[11px] font-medium">{day.label}</p>
                  </div>
                  {entry && (
                    <button
                      onClick={() => clearDay(day.iso)}
                      disabled={busy === `day-${day.iso}`}
                      className="text-stone transition-colors hover:text-clay"
                      aria-label={`Clear ${day.label}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {outfit ? (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-12 w-9 shrink-0 overflow-hidden bg-sand">
                      <SmartImage
                        src={outfit.items[0]?.image ?? ""}
                        alt={outfit.items[0]?.name ?? outfit.title}
                        label={outfit.title}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[11px]">{outfit.title.split(" · ")[0]}</p>
                      <p className="text-[9px] uppercase tracking-[0.08em] text-stone">
                        {outfit.occasion}
                      </p>
                      {repeated && (
                        <p className="mt-0.5 flex items-center gap-1 text-[9px] text-clay">
                          <TriangleAlert className="h-2.5 w-2.5" /> Repeated this week
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-[10px] text-stone">Nothing planned</p>
                )}

                <select
                  value={entry?.outfitId ?? ""}
                  onChange={(event) => setDay(day.iso, event.target.value)}
                  disabled={busy === `day-${day.iso}` || outfits.length === 0}
                  aria-label={`Outfit for ${day.label}`}
                  className="mt-2 w-full border border-ink/15 bg-paper px-2 py-1.5 text-[10px] outline-none focus:border-ink disabled:opacity-40"
                >
                  <option value="">{outfits.length ? "Choose a look" : "No saved looks"}</option>
                  {outfits.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.title.split(" · ")[0]} · {inr(option.total)}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-[10px] leading-relaxed text-stone">
          One look per day. Planner entries stay on your account and disappear from this week view as
          dates pass.
        </p>
      </Panel>

      {planFor && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm">
          <button className="absolute inset-0 cursor-default" aria-label="Close" onClick={() => setPlanFor(null)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Plan outfit"
            className="relative w-full max-w-sm border border-ink/10 bg-paper p-6 shadow-lift"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-smoke">Plan an outfit</p>
                <h3 className="mt-1 font-display text-xl">{planFor.title}</h3>
              </div>
              <button onClick={() => setPlanFor(null)} className="btn-icon" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <label htmlFor="plan-date" className="field-label mt-5">
              Date
            </label>
            <input
              id="plan-date"
              type="date"
              value={planDate}
              onChange={(event) => setPlanDate(event.target.value)}
              className="input"
            />
            <div className="mt-5 flex gap-2">
              <button onClick={plan} disabled={planning || !planDate} className="btn-primary py-2.5 text-[10px]">
                {planning && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save to planner
              </button>
              <button onClick={() => setPlanFor(null)} className="btn-secondary py-2.5 text-[10px]">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
