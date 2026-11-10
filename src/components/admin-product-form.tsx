"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import type { Product } from "@/lib/types";

interface ProductFormProps {
  categories: string[];
  brands: string[];
  initial?: Product;
}

interface FormState {
  name: string;
  brand: string;
  category: string;
  audience: string;
  price: string;
  mrp: string;
  stock: string;
  sizes: string;
  colors: string;
  styles: string;
  occasions: string;
  seasons: string;
  fit: string;
  image: string;
  gallery: string;
  description: string;
  specs: string;
  retailer: string;
  affiliateUrl: string;
  sponsored: boolean;
  rating: string;
  reviews: string;
}

function toForm(product?: Product): FormState {
  return {
    name: product?.name ?? "",
    brand: product?.brand ?? "",
    category: product?.category ?? "T-Shirts",
    audience: product?.audience ?? "unisex",
    price: product?.price?.toString() ?? "",
    mrp: product?.mrp?.toString() ?? "",
    stock: product?.stock?.toString() ?? "10",
    sizes: product?.sizes.join(", ") ?? "S, M, L, XL",
    colors: product?.colors.join(", ") ?? "Black",
    styles: product?.styles.join(", ") ?? "Casual",
    occasions: product?.occasions.join(", ") ?? "Casual",
    seasons: product?.seasons.join(", ") ?? "All-season",
    fit: product?.fit ?? "regular",
    image: product?.image ?? "",
    gallery: product?.gallery.join(", ") ?? "",
    description: product?.description ?? "",
    specs: product?.specs.map((spec) => `${spec.label}: ${spec.value}`).join("\n") ?? "",
    retailer: product?.retailer ?? "Myntra",
    affiliateUrl: product?.affiliateUrl ?? "",
    sponsored: product?.sponsored ?? false,
    rating: product?.rating?.toString() ?? "4.4",
    reviews: product?.reviews?.toString() ?? "0",
  };
}

export function AdminProductForm({ categories, brands, initial }: ProductFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(toForm(initial));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function upload(file: File) {
    setUploading(true);
    setError("");
    try {
      const data = new FormData();
      data.append("file", file);
      const response = await fetch("/api/admin/upload", { method: "POST", body: data });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        setError(payload.error ?? "Upload failed.");
        return;
      }
      update("image", payload.url);
      update("gallery", [payload.url, form.gallery].filter(Boolean).join(", "));
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const body = {
      ...form,
      price: Number(form.price),
      mrp: Number(form.mrp),
      stock: Number(form.stock),
      rating: Number(form.rating),
      reviews: Number(form.reviews),
    };

    try {
      const response = await fetch(
        initial ? `/api/admin/products/${initial.id}` : "/api/admin/products",
        {
          method: initial ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not save the product.");
        return;
      }
      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "input";

  return (
    <form onSubmit={submit} className="space-y-8">
      {error && <p className="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

      <section className="grid gap-5 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="field-label">Product name</span>
          <input className={inputClass} value={form.name} onChange={(event) => update("name", event.target.value)} required />
        </label>
        <label>
          <span className="field-label">Brand</span>
          <input
            className={inputClass}
            value={form.brand}
            onChange={(event) => update("brand", event.target.value)}
            list="brand-options"
            required
          />
          <datalist id="brand-options">
            {brands.map((brand) => <option key={brand} value={brand} />)}
          </datalist>
        </label>
        <label>
          <span className="field-label">Category</span>
          <select className={inputClass} value={form.category} onChange={(event) => update("category", event.target.value)}>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
        <label>
          <span className="field-label">Audience</span>
          <select className={inputClass} value={form.audience} onChange={(event) => update("audience", event.target.value)}>
            <option value="men">Men</option>
            <option value="women">Women</option>
            <option value="unisex">Unisex</option>
          </select>
        </label>
        <label>
          <span className="field-label">Fit</span>
          <select className={inputClass} value={form.fit} onChange={(event) => update("fit", event.target.value)}>
            <option value="slim">Slim</option>
            <option value="regular">Regular</option>
            <option value="oversized">Oversized</option>
          </select>
        </label>
        <label>
          <span className="field-label">Price (₹)</span>
          <input type="number" min={1} className={inputClass} value={form.price} onChange={(event) => update("price", event.target.value)} required />
        </label>
        <label>
          <span className="field-label">MRP (₹)</span>
          <input type="number" min={1} className={inputClass} value={form.mrp} onChange={(event) => update("mrp", event.target.value)} required />
        </label>
        <label>
          <span className="field-label">Stock</span>
          <input type="number" min={0} className={inputClass} value={form.stock} onChange={(event) => update("stock", event.target.value)} />
        </label>
        <label>
          <span className="field-label">Rating (1–5)</span>
          <input type="number" step="0.1" min={1} max={5} className={inputClass} value={form.rating} onChange={(event) => update("rating", event.target.value)} />
        </label>
      </section>

      <section>
        <p className="field-label">Product image</p>
        <div className="flex flex-wrap items-start gap-4">
          <div className="h-32 w-24 overflow-hidden border border-ink/10 bg-cream">
            {form.image ? (
              <img src={form.image} alt="Product preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-[10px] text-stone">No image</div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <input
              className={inputClass}
              value={form.image}
              onChange={(event) => update("image", event.target.value)}
              placeholder="/products/8148576.jpg or https://…"
              required
            />
            <label className="inline-flex cursor-pointer items-center gap-2 border border-ink/20 px-3 py-2 text-[10px] uppercase tracking-[0.12em] hover:border-ink">
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
              Upload image
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void upload(file);
                }}
              />
            </label>
            <input
              className={inputClass}
              value={form.gallery}
              onChange={(event) => update("gallery", event.target.value)}
              placeholder="Gallery image URLs, comma separated"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2">
        <label>
          <span className="field-label">Colours</span>
          <input className={inputClass} value={form.colors} onChange={(event) => update("colors", event.target.value)} placeholder="Black, Cream" />
        </label>
        <label>
          <span className="field-label">Sizes</span>
          <input className={inputClass} value={form.sizes} onChange={(event) => update("sizes", event.target.value)} placeholder="S, M, L, XL" />
        </label>
        <label>
          <span className="field-label">Styles</span>
          <input className={inputClass} value={form.styles} onChange={(event) => update("styles", event.target.value)} placeholder="Minimalist, Casual" />
        </label>
        <label>
          <span className="field-label">Occasions</span>
          <input className={inputClass} value={form.occasions} onChange={(event) => update("occasions", event.target.value)} placeholder="Office, Date" />
        </label>
        <label>
          <span className="field-label">Seasons</span>
          <input className={inputClass} value={form.seasons} onChange={(event) => update("seasons", event.target.value)} placeholder="Summer, All-season" />
        </label>
      </section>

      <label className="block">
        <span className="field-label">Description</span>
        <textarea
          className={`${inputClass} resize-none`}
          rows={4}
          value={form.description}
          onChange={(event) => update("description", event.target.value)}
          required
        />
      </label>

      <label className="block">
        <span className="field-label">Specifications (one per line, “Label: Value”)</span>
        <textarea
          className={`${inputClass} resize-none`}
          rows={4}
          value={form.specs}
          onChange={(event) => update("specs", event.target.value)}
          placeholder={"Fabric: Cotton\nFit: Oversized"}
        />
      </label>

      <section className="grid gap-5 sm:grid-cols-2">
        <label>
          <span className="field-label">Retailer</span>
          <input className={inputClass} value={form.retailer} onChange={(event) => update("retailer", event.target.value)} />
        </label>
        <label>
          <span className="field-label">Affiliate URL</span>
          <input
            className={inputClass}
            value={form.affiliateUrl}
            onChange={(event) => update("affiliateUrl", event.target.value)}
            placeholder="Leave blank to generate a demo link"
          />
        </label>
      </section>

      <label className="flex items-center gap-3 border border-ink/10 bg-cream p-4">
        <input
          type="checkbox"
          checked={form.sponsored}
          onChange={(event) => update("sponsored", event.target.checked)}
          className="h-4 w-4 accent-ink"
        />
        <span className="text-xs">
          Sponsored product
          <span className="ml-2 text-[11px] text-smoke">
            Shows a clear “Sponsored” label on cards and the product page.
          </span>
        </span>
      </label>

      <div className="flex flex-wrap gap-3 border-t border-ink/10 pt-6">
        <button type="submit" className="btn-primary" disabled={saving || uploading}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : initial ? "Save changes" : "Create product"}
        </button>
        <button type="button" onClick={() => router.push("/admin/products")} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
