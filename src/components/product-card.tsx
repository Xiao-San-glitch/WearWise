"use client";

import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/types";
import { cn, discountPercent, inr } from "@/lib/format";
import { useStore } from "./store-provider";
import { SmartImage } from "./smart-image";

export function ProductCard({
  product,
  className,
  priority,
}: {
  product: Product;
  className?: string;
  priority?: boolean;
}) {
  const { toggleWishlist, isWishlisted, addToCart, hydrated } = useStore();
  const wished = hydrated && isWishlisted(product.id);
  const discount = discountPercent(product.price, product.mrp);
  const hoverImage = product.gallery.find((image) => image !== product.image) ?? product.image;

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <div className="relative overflow-hidden bg-sand">
        <Link href={`/product/${product.slug}`} aria-label={`View ${product.name}`} className="block">
          <div className="relative aspect-[3/4] w-full">
            <SmartImage
              src={product.image}
              alt={`${product.name} by ${product.brand}`}
              wrapperClassName="absolute inset-0"
              className="transition-transform duration-[900ms] ease-out group-hover:scale-[1.04] group-hover:opacity-0"
              priority={priority}
              label={product.name}
            />
            <div className="absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100">
              <SmartImage
                src={hoverImage}
                alt=""
                wrapperClassName="h-full w-full"
                className="scale-[1.04]"
                label={product.name}
              />
            </div>
          </div>
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.sponsored && (
            <span className="bg-paper/95 px-2 py-1 text-[9px] uppercase tracking-[0.14em] text-smoke backdrop-blur">
              Sponsored
            </span>
          )}
          {discount > 0 && (
            <span className="bg-ink px-2 py-1 text-[9px] uppercase tracking-[0.14em] text-cream">
              {discount}% off
            </span>
          )}
        </div>

        <button
          onClick={() =>
            toggleWishlist({
              id: product.id,
              slug: product.slug,
              name: product.name,
              brand: product.brand,
              image: product.image,
              price: product.price,
              mrp: product.mrp,
              category: product.category,
            })
          }
          aria-label={wished ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={wished}
          className="absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-paper/90 text-ink backdrop-blur transition-transform hover:scale-105"
        >
          <Heart className={cn("h-4 w-4", wished && "fill-ink")} />
        </button>

        <div className="absolute inset-x-0 bottom-0 translate-y-full p-2.5 transition-transform duration-300 group-hover:translate-y-0">
          <div className="flex gap-2">
            <button
              onClick={() =>
                addToCart({
                  productId: product.id,
                  slug: product.slug,
                  name: product.name,
                  brand: product.brand,
                  image: product.image,
                  price: product.price,
                  mrp: product.mrp,
                  size: product.sizes[Math.floor(product.sizes.length / 2)] ?? product.sizes[0],
                  retailer: product.retailer,
                  affiliateUrl: product.affiliateUrl,
                })
              }
              className="flex flex-1 items-center justify-center gap-2 bg-paper/95 py-2.5 text-[10px] font-medium uppercase tracking-[0.16em] text-ink backdrop-blur transition-colors hover:bg-paper"
            >
              <ShoppingBag className="h-3.5 w-3.5" /> Add to bag
            </button>
            <Link
              href={`/go/${product.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center bg-ink px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.16em] text-cream transition-colors hover:bg-graphite"
            >
              Buy
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-smoke">{product.brand}</p>
          <span className="text-[10px] uppercase tracking-[0.12em] text-stone">{product.retailer}</span>
        </div>
        <h3 className="mt-1 font-display text-[17px] leading-snug">
          <Link href={`/product/${product.slug}`} className="hover:underline underline-offset-4">
            {product.name}
          </Link>
        </h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-sm font-medium tabular">{inr(product.price)}</span>
          {product.mrp > product.price && (
            <span className="text-xs text-stone line-through tabular">{inr(product.mrp)}</span>
          )}
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          {product.colors.slice(0, 3).map((color) => (
            <span
              key={color}
              title={color}
              className="h-2.5 w-2.5 rounded-full border border-ink/15"
              style={{ backgroundColor: colorToHex(color) }}
            />
          ))}
          <span className="ml-1 truncate text-[10px] uppercase tracking-[0.1em] text-stone">
            {product.colors.slice(0, 2).join(" / ")}
          </span>
        </div>
      </div>
    </article>
  );
}

export function colorToHex(color: string): string {
  const map: Record<string, string> = {
    Black: "#14110F",
    White: "#FAF8F4",
    Cream: "#F0E7D8",
    Beige: "#D9CBB5",
    Grey: "#9B9994",
    Navy: "#1F2A3C",
    Blue: "#4A6FA5",
    Indigo: "#33456B",
    Olive: "#6B6B4A",
    Wine: "#5A2434",
    Tan: "#B08157",
    Brown: "#6D4C36",
    Red: "#A02B2B",
    Green: "#4B6B4F",
    Pink: "#E2B5BE",
    Orange: "#D2743B",
    Gold: "#C8A464",
  };
  return map[color] ?? "#D9CBB5";
}
