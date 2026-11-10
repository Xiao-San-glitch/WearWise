import type { Product } from "./types";

export interface ProductInput {
  name?: string;
  brand?: string;
  price?: number | string;
  mrp?: number | string;
  category?: string;
  audience?: string;
  colors?: string[] | string;
  styles?: string[] | string;
  occasions?: string[] | string;
  seasons?: string[] | string;
  fit?: string;
  sizes?: string[] | string;
  image?: string;
  gallery?: string[] | string;
  description?: string;
  specs?: { label: string; value: string }[] | string;
  retailer?: string;
  affiliateUrl?: string;
  sponsored?: boolean;
  stock?: number | string;
  rating?: number | string;
  reviews?: number | string;
}

function toArray(value: string[] | string | undefined): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 70);
}

export function normalizeProductInput(
  input: ProductInput,
): { ok: true; value: Omit<Product, "id" | "createdAt" | "popularity"> } | { ok: false; error: string } {
  const name = String(input.name ?? "").trim();
  const brand = String(input.brand ?? "").trim();
  const category = String(input.category ?? "").trim();
  const description = String(input.description ?? "").trim();
  const price = Number(input.price);
  const mrp = Number(input.mrp ?? input.price);
  const image = String(input.image ?? "").trim();

  if (name.length < 2) return { ok: false, error: "Product name is required." };
  if (!brand) return { ok: false, error: "Brand is required." };
  if (!category) return { ok: false, error: "Category is required." };
  if (!Number.isFinite(price) || price <= 0) return { ok: false, error: "Enter a valid price." };
  if (!Number.isFinite(mrp) || mrp <= 0) return { ok: false, error: "Enter a valid MRP." };
  if (!image) return { ok: false, error: "A product image is required." };
  if (description.length < 10) return { ok: false, error: "Add a short description (10+ characters)." };

  const audience = ["men", "women", "unisex"].includes(String(input.audience))
    ? (input.audience as Product["audience"])
    : "unisex";
  const fit = ["slim", "regular", "oversized"].includes(String(input.fit))
    ? (input.fit as Product["fit"])
    : "regular";

  const specsRaw = input.specs;
  let specs: { label: string; value: string }[] = [];
  if (Array.isArray(specsRaw)) {
    specs = specsRaw.filter((spec) => spec?.label && spec?.value);
  } else if (typeof specsRaw === "string" && specsRaw.trim()) {
    specs = specsRaw
      .split("\n")
      .map((line) => line.split(":"))
      .filter((parts) => parts.length >= 2)
      .map((parts) => ({ label: parts[0].trim(), value: parts.slice(1).join(":").trim() }));
  }

  const gallery = toArray(input.gallery);
  const affiliateUrl = String(input.affiliateUrl ?? "").trim();

  return {
    ok: true,
    value: {
      name,
      slug: slugify(name),
      brand,
      price: Math.round(price),
      mrp: Math.round(mrp),
      category,
      audience,
      colors: toArray(input.colors).length ? toArray(input.colors) : ["Black"],
      styles: toArray(input.styles).length ? toArray(input.styles) : ["Casual"],
      occasions: toArray(input.occasions).length ? toArray(input.occasions) : ["Casual"],
      seasons: toArray(input.seasons).length ? toArray(input.seasons) : ["All-season"],
      fit,
      sizes: toArray(input.sizes).length ? toArray(input.sizes) : ["S", "M", "L", "XL"],
      image,
      gallery: gallery.length ? gallery : [image],
      description,
      specs,
      retailer: String(input.retailer ?? "Myntra").trim() || "Myntra",
      affiliateUrl:
        affiliateUrl ||
        `https://www.myntra.com/${slugify(category)}?rawQuery=${encodeURIComponent(
          `${brand} ${name}`,
        )}&utm_source=wearwise&utm_medium=affiliate&utm_campaign=${slugify(name)}`,
      sponsored: Boolean(input.sponsored),
      rating: Math.min(5, Math.max(1, Number(input.rating) || 4.3)),
      reviews: Math.max(0, Math.round(Number(input.reviews) || 0)),
      stock: Math.max(0, Math.round(Number(input.stock) || 0)),
    },
  };
}
