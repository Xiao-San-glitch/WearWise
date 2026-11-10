"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  Check,
  Heart,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import type { Product } from "@/lib/types";
import { cn, discountPercent, inr } from "@/lib/format";
import { useStore } from "./store-provider";
import { SmartImage } from "./smart-image";
import { colorToHex } from "./product-card";

export function ProductGallery({ product }: { product: Product }) {
  const images = product.gallery.length ? product.gallery : [product.image];
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      <div className="flex gap-3 sm:flex-col">
        {images.map((image, index) => (
          <button
            key={`${image}-${index}`}
            onClick={() => setActive(index)}
            aria-label={`View image ${index + 1}`}
            className={cn(
              "relative h-20 w-16 overflow-hidden border transition-all sm:h-24 sm:w-20",
              active === index ? "border-ink" : "border-transparent opacity-70 hover:opacity-100",
            )}
          >
            <SmartImage src={image} alt="" />
          </button>
        ))}
      </div>
      <div className="relative flex-1 overflow-hidden bg-sand">
        <div className="aspect-[3/4] w-full">
          <SmartImage
            src={images[active]}
            alt={`${product.name} by ${product.brand}`}
            priority
            label={product.name}
          />
        </div>
        {product.sponsored && (
          <span className="absolute left-4 top-4 bg-paper/90 px-2.5 py-1 text-[9px] uppercase tracking-[0.14em] text-smoke backdrop-blur">
            Sponsored
          </span>
        )}
      </div>
    </div>
  );
}

export function PurchasePanel({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, isWishlisted, hydrated } = useStore();
  const [size, setSize] = useState<string | null>(
    product.sizes.length === 1 ? product.sizes[0] : null,
  );
  const [color, setColor] = useState(product.colors[0]);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const discount = discountPercent(product.price, product.mrp);
  const wished = hydrated && isWishlisted(product.id);

  function requireSize(): boolean {
    if (!size) {
      setError("Please select a size to continue.");
      return false;
    }
    setError("");
    return true;
  }

  function add() {
    if (!requireSize() || !size) return;
    addToCart(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        image: product.image,
        price: product.price,
        mrp: product.mrp,
        size,
        retailer: product.retailer,
        affiliateUrl: product.affiliateUrl,
      },
      quantity,
    );
  }

  function save() {
    toggleWishlist({
      id: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      image: product.image,
      price: product.price,
      mrp: product.mrp,
      category: product.category,
    });
  }

  const buyHref = `/go/${product.id}?size=${encodeURIComponent(size ?? "")}&color=${encodeURIComponent(color)}`;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-smoke">{product.brand}</p>
          <h1 className="mt-2 font-display text-[clamp(1.8rem,3vw,2.6rem)] leading-tight">
            {product.name}
          </h1>
        </div>
        <button
          onClick={save}
          aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
          aria-pressed={wished}
          className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink/15 transition-colors hover:border-ink"
        >
          <Heart className={cn("h-4 w-4", wished && "fill-ink")} />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1 text-xs">
          <span className="font-medium">{product.rating.toFixed(1)}</span>
          <span className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, index) => (
              <span
                key={index}
                className={cn("text-[11px]", index < Math.round(product.rating) ? "text-ink" : "text-sand")}
              >
                ★
              </span>
            ))}
          </span>
          <span className="text-stone">({product.reviews} reviews)</span>
        </span>
        <span className="h-3 w-px bg-ink/15" />
        <span className="text-[10px] uppercase tracking-[0.14em] text-smoke">
          {product.category} · {product.retailer}
        </span>
      </div>

      <div className="mt-6 flex flex-wrap items-baseline gap-3 border-b border-ink/10 pb-6">
        <span className="text-2xl font-medium tabular">{inr(product.price)}</span>
        {product.mrp > product.price && (
          <>
            <span className="text-sm text-stone line-through tabular">{inr(product.mrp)}</span>
            <span className="bg-clay/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-clay">
              {discount}% off
            </span>
          </>
        )}
        <span className="ml-auto text-[10px] uppercase tracking-[0.12em] text-stone">
          Inclusive of all taxes
        </span>
      </div>

      <div className="mt-6">
        <p className="field-label">Colour · {color}</p>
        <div className="flex flex-wrap gap-2.5">
          {product.colors.map((option) => (
            <button
              key={option}
              onClick={() => setColor(option)}
              aria-label={option}
              aria-pressed={color === option}
              className={cn(
                "relative h-9 w-9 rounded-full border transition-all",
                color === option ? "border-ink ring-1 ring-ink ring-offset-2 ring-offset-paper" : "border-ink/20",
              )}
              style={{ backgroundColor: colorToHex(option) }}
              title={option}
            />
          ))}
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <p className="field-label mb-0">Size</p>
          <Link
            href="/about#size-guide"
            className="text-[10px] uppercase tracking-[0.12em] text-smoke underline underline-offset-2"
          >
            Size guide
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {product.sizes.map((option) => (
            <button
              key={option}
              onClick={() => {
                setSize(option);
                setError("");
              }}
              aria-pressed={size === option}
              className={cn(
                "min-w-[52px] border px-3 py-2.5 text-xs transition-colors",
                size === option
                  ? "border-ink bg-ink text-cream"
                  : "border-ink/20 text-graphite hover:border-ink",
              )}
            >
              {option}
            </button>
          ))}
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>

      <div className="mt-6 flex items-center gap-4">
        <div className="flex items-center border border-ink/20">
          <button
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            className="px-3 py-2.5 text-ink disabled:opacity-30"
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-8 text-center text-sm tabular">{quantity}</span>
          <button
            onClick={() => setQuantity((value) => Math.min(10, value + 1))}
            className="px-3 py-2.5 text-ink"
            aria-label="Increase quantity"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="flex items-center gap-1.5 text-[11px] text-smoke">
          <Package className="h-3.5 w-3.5" />
          {product.stock > 0 ? `In stock · ${product.stock} left` : "Currently unavailable"}
        </p>
      </div>

      <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
        <button onClick={add} className="btn-primary w-full" disabled={product.stock === 0}>
          <ShoppingBag className="h-4 w-4" /> Add to bag
        </button>
        <Link
          href={buyHref}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary w-full"
        >
          Buy now <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-5 space-y-2.5 border border-ink/10 bg-cream/60 p-4">
        <p className="flex items-start gap-2 text-[11px] leading-relaxed text-graphite">
          <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Purchases are completed on {product.retailer}. Typical delivery is 3–6 working days.
        </p>
        <p className="flex items-start gap-2 text-[11px] leading-relaxed text-graphite">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          WearWise may earn a commission from this link. The price you pay is unchanged.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-1.5">
        {[...product.styles, product.fit, product.audience].map((tag) => (
          <Link
            key={`${tag}-${product.id}`}
            href={`/search?q=${encodeURIComponent(`${tag} ${product.category}`)}`}
            className="chip px-2.5 py-1 normal-case tracking-normal text-smoke"
          >
            {tag}
          </Link>
        ))}
      </div>

      <p className="mt-5 flex items-center gap-1.5 text-[11px] text-smoke">
        <Check className="h-3.5 w-3.5" /> Free returns within 14 days as per retailer policy
      </p>
    </div>
  );
}
