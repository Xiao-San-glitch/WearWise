"use client";

import { useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Search, Shirt, Trash2, X } from "lucide-react";
import type { WardrobeItem } from "@/lib/types";
import { inr } from "@/lib/format";
import { EmptyState } from "../ui";
import { SmartImage } from "../smart-image";
import { WardrobeItemForm } from "./wardrobe-item-form";
import { COLOR_HEX, StatusNote } from "./closet-shared";

export function WardrobeManager({
  items,
  onChanged,
  notify,
}: {
  items: WardrobeItem[];
  onChanged: () => Promise<void> | void;
  notify: (message: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [color, setColor] = useState("All");
  const [sort, setSort] = useState("recent");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WardrobeItem | undefined>();
  const [deleting, setDeleting] = useState<WardrobeItem | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [error, setError] = useState("");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(items.map((item) => item.category)))],
    [items],
  );
  const colors = useMemo(
    () => ["All", ...Array.from(new Set(items.map((item) => item.color)))],
    [items],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const result = items.filter((item) => {
      if (category !== "All" && item.category !== category) return false;
      if (color !== "All" && item.color !== color) return false;
      if (!term) return true;
      return [item.name, item.brand, item.style, item.season, item.color, item.category]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
    return result.sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "category") return a.category.localeCompare(b.category);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [items, query, category, color, sort]);

  const value = items.reduce((sum, item) => sum + item.price, 0);
  const hasFilters = query.trim() !== "" || category !== "All" || color !== "All";

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/wardrobe/${deleting.id}`, { method: "DELETE" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not delete that piece.");
        return;
      }
      notify("Piece removed from your closet");
      setDeleting(null);
      await onChanged();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl">My wardrobe</h2>
          <p className="mt-1 text-sm text-smoke">
            {items.length} {items.length === 1 ? "piece" : "pieces"} · {inr(value)} wardrobe value
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(undefined);
            setFormOpen(true);
          }}
          className="btn-primary py-2.5 text-[10px]"
        >
          <Plus className="h-3.5 w-3.5" /> Add a piece
        </button>
      </div>

      {items.length > 0 && (
        <div className="mt-6 grid gap-3 border border-ink/10 bg-cream/50 p-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-stone" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search black jeans…"
              aria-label="Search wardrobe"
              className="w-full border border-ink/15 bg-paper py-2.5 pl-9 pr-3 text-xs outline-none focus:border-ink"
            />
          </label>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-label="Filter by category"
            className="border border-ink/15 bg-paper px-3 py-2.5 text-xs outline-none focus:border-ink"
          >
            {categories.map((entry) => (
              <option key={entry} value={entry}>
                {entry === "All" ? "All categories" : entry}
              </option>
            ))}
          </select>
          <select
            value={color}
            onChange={(event) => setColor(event.target.value)}
            aria-label="Filter by colour"
            className="border border-ink/15 bg-paper px-3 py-2.5 text-xs outline-none focus:border-ink"
          >
            {colors.map((entry) => (
              <option key={entry} value={entry}>
                {entry === "All" ? "All colours" : entry}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            aria-label="Sort wardrobe"
            className="border border-ink/15 bg-paper px-3 py-2.5 text-xs outline-none focus:border-ink"
          >
            <option value="recent">Recently added</option>
            <option value="price-asc">Value: low to high</option>
            <option value="price-desc">Value: high to low</option>
            <option value="category">Category A–Z</option>
          </select>
        </div>
      )}

      {items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<Shirt className="h-8 w-8" />}
            title="Your closet is empty"
            description="Add what you already own — a top, a bottom and shoes is enough to start. We'll build outfits from these pieces and show you what's worth buying next."
            action={
              <button
                onClick={() => {
                  setEditing(undefined);
                  setFormOpen(true);
                }}
                className="btn-primary py-2.5 text-[10px]"
              >
                <Plus className="h-3.5 w-3.5" /> Add your first piece
              </button>
            }
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 border border-dashed border-ink/15 bg-cream/40 px-6 py-14 text-center">
          <p className="font-display text-xl">No pieces match that</p>
          <p className="mt-2 text-sm text-smoke">Try a different search or clear the filters.</p>
          {hasFilters && (
            <button
              onClick={() => {
                setQuery("");
                setCategory("All");
                setColor("All");
              }}
              className="btn-secondary mt-5 py-2.5 text-[10px]"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((item) => (
            <article key={item.id} className="group border border-ink/10 bg-paper">
              <div className="relative aspect-[3/4] overflow-hidden bg-sand">
                <SmartImage
                  src={item.image}
                  alt={item.name}
                  label={item.name}
                  className="transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <span className="absolute left-2 top-2 bg-paper/95 px-2 py-1 text-[9px] uppercase tracking-[0.1em]">
                  {item.category}
                </span>
                <div className="absolute inset-x-0 bottom-0 flex translate-y-0 justify-end gap-1.5 bg-gradient-to-t from-ink/55 to-transparent p-2 sm:opacity-0 sm:transition-opacity sm:duration-300 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                  <button
                    onClick={() => {
                      setEditing(item);
                      setFormOpen(true);
                    }}
                    className="flex h-8 w-8 items-center justify-center bg-paper/95 text-ink transition-colors hover:bg-ink hover:text-cream"
                    aria-label={`Edit ${item.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleting(item)}
                    className="flex h-8 w-8 items-center justify-center bg-paper/95 text-ink transition-colors hover:bg-clay hover:text-cream"
                    aria-label={`Delete ${item.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-[9px] uppercase tracking-[0.12em] text-smoke">
                  {item.brand || item.category}
                </p>
                <h3 className="mt-1 line-clamp-2 text-[12px] leading-snug">{item.name}</h3>
                <div className="mt-2 flex items-center justify-between text-[10px] text-smoke">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full border border-ink/20"
                      style={{ backgroundColor: COLOR_HEX[item.color] ?? "#B9AEA0" }}
                      aria-hidden
                    />
                    {item.color}
                    {item.size && <span className="text-stone">· {item.size}</span>}
                  </span>
                  <span className="tabular">{inr(item.price)}</span>
                </div>
              </div>
            </article>
          ))}

          <button
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
            className="flex min-h-[220px] flex-col items-center justify-center gap-2 border border-dashed border-ink/20 bg-cream/30 px-4 text-center transition-colors hover:border-ink hover:bg-cream"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/20">
              <Plus className="h-4 w-4" />
            </span>
            <span className="text-[11px] uppercase tracking-[0.12em]">Add a piece</span>
            <span className="text-[10px] text-stone">Upload a photo or add it manually</span>
          </button>
        </div>
      )}

      {formOpen && (
        <WardrobeItemForm
          item={editing}
          onClose={() => setFormOpen(false)}
          onSaved={onChanged}
          notify={notify}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm">
          <button className="absolute inset-0 cursor-default" aria-label="Cancel" onClick={() => setDeleting(null)} />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label="Delete wardrobe piece"
            className="relative w-full max-w-md border border-ink/10 bg-paper p-6 shadow-lift"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-smoke">Remove piece</p>
                <h2 className="mt-2 font-display text-2xl">{deleting.name}</h2>
              </div>
              <button onClick={() => setDeleting(null)} className="btn-icon" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-smoke">
              This removes the piece from your closet and from any saved outfits. Uploaded photos are
              deleted too. This can&apos;t be undone.
            </p>
            {error && (
              <div className="mt-4">
                <StatusNote kind="error">{error}</StatusNote>
              </div>
            )}
            <div className="mt-6 flex gap-2">
              <button
                onClick={confirmDelete}
                disabled={deleteBusy}
                className="btn bg-clay px-5 py-2.5 text-[10px] text-cream hover:bg-ink"
              >
                {deleteBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Delete piece
              </button>
              <button onClick={() => setDeleting(null)} className="btn-secondary py-2.5 text-[10px]">
                Keep it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
