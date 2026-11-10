"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Upload, X } from "lucide-react";
import {
  WARDROBE_AUDIENCES,
  WARDROBE_CATEGORIES,
  WARDROBE_COLORS,
  WARDROBE_SEASONS,
  WARDROBE_STYLES,
} from "@/lib/wardrobe";
import type { WardrobeAudience, WardrobeCategory, WardrobeItem } from "@/lib/types";
import { cn } from "@/lib/format";
import { SmartImage } from "../smart-image";
import { StatusNote } from "./closet-shared";

const CATEGORY_HINTS: { match: RegExp; category: WardrobeCategory }[] = [
  { match: /jean|denim/i, category: "Jeans" },
  { match: /trouser|chino|pant|jogger/i, category: "Pants" },
  { match: /short/i, category: "Shorts" },
  { match: /t-?shirt|tee\b/i, category: "T-shirts" },
  { match: /shirt/i, category: "Shirts" },
  { match: /jacket|blazer|bomber|coat|overshirt/i, category: "Jackets" },
  { match: /shoe|sneaker|heel|boot|sandal|loafer/i, category: "Shoes" },
  { match: /watch|bag|belt|scarf|cap|sunglass|jewel/i, category: "Accessories" },
  { match: /kurta|saree|sari|lehenga|sherwani|ethnic/i, category: "Ethnic wear" },
  { match: /top|hoodie|sweater|sweatshirt|blouse/i, category: "Tops" },
];

function inferCategory(name: string): WardrobeCategory | null {
  return CATEGORY_HINTS.find((hint) => hint.match.test(name))?.category ?? null;
}

export function WardrobeItemForm({
  item,
  onClose,
  onSaved,
  notify,
}: {
  item?: WardrobeItem;
  onClose: () => void;
  onSaved: () => void;
  notify: (message: string) => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [category, setCategory] = useState<WardrobeCategory>(item?.category ?? "Tops");
  const [categoryTouched, setCategoryTouched] = useState(Boolean(item));
  const [color, setColor] = useState(item?.color ?? "Black");
  const [brand, setBrand] = useState(item?.brand ?? "");
  const [price, setPrice] = useState(item ? String(item.price) : "");
  const [size, setSize] = useState(item?.size ?? "M");
  const [style, setStyle] = useState(item?.style ?? "Minimal");
  const [season, setSeason] = useState(item?.season ?? "All-season");
  const [audience, setAudience] = useState<WardrobeAudience>(item?.audience ?? "Unisex");
  const [image, setImage] = useState(item?.image ?? "");
  const [preview, setPreview] = useState(item?.image ?? "");
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => nameRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function handleName(value: string) {
    setName(value);
    if (!categoryTouched) {
      const inferred = inferCategory(value);
      if (inferred) setCategory(inferred);
    }
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Use a JPG, PNG or WEBP image.");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setError("Image must be under 6 MB.");
      return;
    }

    if (!name.trim()) {
      const base = file.name
        .replace(/\.[^.]+$/, "")
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80);
      if (base) handleName(base.charAt(0).toUpperCase() + base.slice(1));
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/wardrobe/upload", { method: "POST", body: form });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setError(data.error ?? "Upload failed. Try a smaller image.");
        setPreview(item?.image ?? "");
        return;
      }
      setImage(data.url);
      setPreview(data.url);
    } catch {
      setError("Upload failed. Check your connection and try again.");
      setPreview(item?.image ?? "");
    } finally {
      setUploading(false);
      URL.revokeObjectURL(objectUrl);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const numericPrice = Number(price);
    if (name.trim().length < 2) {
      setError("Give the piece a name.");
      return;
    }
    if (!Number.isFinite(numericPrice) || numericPrice < 0) {
      setError("Enter a valid price in rupees.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(item ? `/api/wardrobe/${item.id}` : "/api/wardrobe", {
        method: item ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category,
          color,
          brand: brand.trim(),
          price: Math.round(numericPrice),
          size: size.trim(),
          style,
          season,
          audience,
          image,
          notes: notes.trim(),
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not save this piece.");
        return;
      }
      notify(item ? "Wardrobe piece updated" : `${name.trim()} added to your closet`);
      onSaved();
      onClose();
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
        aria-label={item ? "Edit wardrobe piece" : "Add wardrobe piece"}
        className="relative my-4 w-full max-w-3xl border border-ink/10 bg-paper shadow-lift"
      >
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-smoke">Smart Closet</p>
            <h2 className="mt-1 font-display text-2xl">{item ? "Edit this piece" : "Add a piece"}</h2>
          </div>
          <button onClick={onClose} className="btn-icon" aria-label="Close form">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="grid gap-6 p-5 sm:p-6 md:grid-cols-[220px_minmax(0,1fr)]">
          <div>
            <p className="field-label">Photo</p>
            <div className="relative aspect-[3/4] overflow-hidden border border-ink/10 bg-sand">
              {preview ? (
                <SmartImage src={preview} alt="Wardrobe piece preview" label={name || "Your piece"} />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-stone">
                  <ImagePlus className="h-7 w-7" />
                  <p className="text-[11px] uppercase tracking-[0.12em]">No photo yet</p>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-ink/40 text-cream">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="btn-secondary mt-3 w-full py-2.5 text-[10px]"
            >
              <Upload className="h-3.5 w-3.5" /> {image ? "Replace photo" : "Upload photo"}
            </button>
            {image && (
              <button
                type="button"
                onClick={() => {
                  setImage("");
                  setPreview("");
                }}
                className="mt-2 w-full text-center text-[10px] uppercase tracking-[0.12em] text-smoke underline underline-offset-2"
              >
                Remove photo
              </button>
            )}
            <p className="mt-2 text-[10px] leading-relaxed text-stone">
              JPG, PNG or WEBP up to 6 MB. Optional — pieces without a photo get a monogram tile.
            </p>
          </div>

          <div className="space-y-4">
            {error && <StatusNote kind="error">{error}</StatusNote>}

            <div>
              <label htmlFor="piece-name" className="field-label">
                Piece name
              </label>
              <input
                id="piece-name"
                ref={nameRef}
                value={name}
                onChange={(event) => handleName(event.target.value)}
                maxLength={80}
                required
                placeholder="e.g. Black straight jeans"
                className="input"
              />
              <p className="mt-1.5 text-[10px] text-stone">
                Category is suggested from the name — change it if needed.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="piece-category" className="field-label">
                  Category
                </label>
                <select
                  id="piece-category"
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value as WardrobeCategory);
                    setCategoryTouched(true);
                  }}
                  className="input"
                >
                  {WARDROBE_CATEGORIES.map((entry) => (
                    <option key={entry} value={entry}>
                      {entry}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="piece-colour" className="field-label">
                  Colour
                </label>
                <select
                  id="piece-colour"
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                  className="input"
                >
                  {WARDROBE_COLORS.map((entry) => (
                    <option key={entry} value={entry}>
                      {entry}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="piece-brand" className="field-label">
                  Brand <span className="normal-case tracking-normal text-stone">(optional)</span>
                </label>
                <input
                  id="piece-brand"
                  value={brand}
                  onChange={(event) => setBrand(event.target.value)}
                  maxLength={40}
                  placeholder="e.g. NOIR THEORY"
                  className="input"
                />
              </div>
              <div>
                <label htmlFor="piece-price" className="field-label">
                  Price (₹)
                </label>
                <input
                  id="piece-price"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={200000}
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  placeholder="1899"
                  className="input"
                  required
                />
              </div>
              <div>
                <label htmlFor="piece-size" className="field-label">
                  Size
                </label>
                <input
                  id="piece-size"
                  value={size}
                  onChange={(event) => setSize(event.target.value)}
                  maxLength={12}
                  placeholder="M / 32 / UK 8"
                  className="input"
                />
              </div>
              <div>
                <label htmlFor="piece-audience" className="field-label">
                  Fit for
                </label>
                <select
                  id="piece-audience"
                  value={audience}
                  onChange={(event) => setAudience(event.target.value as WardrobeAudience)}
                  className="input"
                >
                  {WARDROBE_AUDIENCES.map((entry) => (
                    <option key={entry} value={entry}>
                      {entry}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="piece-style" className="field-label">
                  Style
                </label>
                <select
                  id="piece-style"
                  value={style}
                  onChange={(event) => setStyle(event.target.value)}
                  className="input"
                >
                  {WARDROBE_STYLES.map((entry) => (
                    <option key={entry} value={entry}>
                      {entry}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="piece-season" className="field-label">
                  Season
                </label>
                <select
                  id="piece-season"
                  value={season}
                  onChange={(event) => setSeason(event.target.value)}
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
              <label htmlFor="piece-notes" className="field-label">
                Notes <span className="normal-case tracking-normal text-stone">(optional)</span>
              </label>
              <input
                id="piece-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={200}
                placeholder="Fit, fabric, how you usually wear it…"
                className="input"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button type="submit" disabled={saving || uploading} className={cn("btn-primary py-2.5 text-[10px]")}>
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {item ? "Save changes" : "Add to closet"}
              </button>
              <button type="button" onClick={onClose} className="btn-secondary py-2.5 text-[10px]">
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
