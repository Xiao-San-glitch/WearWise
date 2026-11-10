import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/db";

export const revalidate = 0;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const now = new Date();
  const staticPaths = [
    "",
    "/shop",
    "/women",
    "/men",
    "/streetwear",
    "/new-in",
    "/ai-stylist",
    "/ai-stylist/assistant",
    "/wishlist",
    "/cart",
    "/login",
    "/signup",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/affiliate-disclosure",
  ];

  return [
    ...staticPaths.map((path) => ({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.7,
    })),
    ...getProducts().map((product) => ({
      url: `${base}/product/${product.slug}`,
      lastModified: new Date(product.createdAt),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
