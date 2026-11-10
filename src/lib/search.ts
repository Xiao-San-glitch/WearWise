import type { Product } from "./types";

export interface ProductFilters {
  q?: string;
  categories?: string[];
  brands?: string[];
  colors?: string[];
  styles?: string[];
  audiences?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: "featured" | "price-asc" | "price-desc" | "newest" | "popularity" | "discount";
  sponsoredOnly?: boolean;
}

export interface InterpretedQuery {
  colors: string[];
  categories: string[];
  styles: string[];
  audience: string | null;
  maxPrice: number | null;
  minPrice: number | null;
  fit: string | null;
  occasion: string | null;
  keywords: string;
  source: "ai" | "local";
}

const CATEGORY_SYNONYMS: Record<string, string[]> = {
  "T-Shirts": ["t-shirt", "tshirt", "t shirt", "tee", "tees"],
  Shirts: ["shirt", "shirts", "oxford", "poplin"],
  Jeans: ["jeans", "denim", "jean"],
  Trousers: ["trouser", "trousers", "pants", "chinos", "shorts", "palazzo"],
  Hoodies: ["hoodie", "hoodies", "sweatshirt", "sweat"],
  Jackets: ["jacket", "jackets", "blazer", "coat", "trench", "outerwear"],
  Dresses: ["dress", "dresses", "gown", "midi"],
  Shoes: ["shoes", "shoe", "sneaker", "sneakers", "footwear", "loafers", "heels", "derby", "runners"],
  Accessories: ["accessory", "accessories", "bag", "watch", "sunglasses", "cap", "belt", "tote"],
  "Ethnic Wear": ["saree", "sari", "kurta", "ethnic", "lehenga", "traditional"],
};

const STYLE_SYNONYMS: Record<string, string[]> = {
  Streetwear: ["streetwear", "street", "oversized", "urban"],
  Minimalist: ["minimal", "minimalist", "clean", "simple"],
  "Old Money": ["old money", "classic", "quiet luxury"],
  Casual: ["casual", "everyday", "relaxed"],
  Formal: ["formal", "office", "business", "tailored"],
  Sporty: ["sporty", "sports", "athleisure", "gym"],
  Traditional: ["traditional", "ethnic", "festive", "wedding"],
  Aesthetic: ["aesthetic", "soft", "editorial"],
};

const COLOR_WORDS = [
  "black", "white", "cream", "beige", "grey", "gray", "navy", "blue", "indigo",
  "olive", "wine", "tan", "red", "green", "pink", "orange", "gold", "brown",
];

const OCCASIONS = ["college", "casual", "party", "wedding", "office", "date", "travel"];

function parsePrice(text: string): { min?: number; max?: number } {
  const range = text.match(/(?:₹|rs\.?|inr)?\s*([\d,]{3,7})\s*(?:-|–|to)\s*(?:₹|rs\.?|inr)?\s*([\d,]{3,7})/);
  if (range) {
    return {
      min: Number(range[1].replace(/,/g, "")),
      max: Number(range[2].replace(/,/g, "")),
    };
  }
  const under = text.match(/(?:under|below|less than|upto|up to|within|max|maximum|budget of)\s*(?:₹|rs\.?|inr)?\s*([\d,]{3,7})/);
  if (under) return { max: Number(under[1].replace(/,/g, "")) };
  const above = text.match(/(?:above|over|more than)\s*(?:₹|rs\.?|inr)?\s*([\d,]{3,7})/);
  if (above) return { min: Number(above[1].replace(/,/g, "")) };
  return {};
}

export function interpretQuery(raw: string): InterpretedQuery {
  const text = raw.toLowerCase();
  const prices = parsePrice(text);
  const colors: string[] = [];
  for (const color of COLOR_WORDS) {
    if (new RegExp(`\\b${color}\\b`).test(text)) {
      const normalized = color === "gray" ? "Grey" : color === "brown" ? "Tan" : color.charAt(0).toUpperCase() + color.slice(1);
      if (!colors.includes(normalized)) colors.push(normalized);
    }
  }
  const categories = Object.entries(CATEGORY_SYNONYMS)
    .filter(([, words]) => words.some((w) => text.includes(w)))
    .map(([category]) => category);
  const styles = Object.entries(STYLE_SYNONYMS)
    .filter(([, words]) => words.some((w) => text.includes(w)))
    .map(([style]) => style);
  const audience = /\b(men|men's|mens|male|boy)\b/.test(text)
    ? "men"
    : /\b(women|women's|womens|female|girl|ladies)\b/.test(text)
      ? "women"
      : null;
  const fit = /\boversized\b/.test(text)
    ? "oversized"
    : /\bslim\b/.test(text)
      ? "slim"
      : /\bregular fit\b/.test(text)
        ? "regular"
        : null;
  const occasion = OCCASIONS.find((o) => text.includes(o)) ?? null;

  return {
    colors,
    categories,
    styles,
    audience,
    maxPrice: prices.max ?? null,
    minPrice: prices.min ?? null,
    fit,
    occasion: occasion ? occasion.charAt(0).toUpperCase() + occasion.slice(1) : null,
    keywords: raw.trim(),
    source: "local",
  };
}

const STOPWORDS = new Set([
  "the", "a", "an", "for", "with", "and", "under", "below", "over", "in", "on", "to",
  "of", "my", "me", "i", "want", "need", "show", "find", "something", "some", "please",
  "below", "upto", "up", "budget", "rupees", "rs", "inr", "buy", "look", "outfit",
]);

function relevance(product: Product, interpreted: InterpretedQuery, raw: string): number {
  const haystack = [
    product.name,
    product.brand,
    product.category,
    product.description,
    product.colors.join(" "),
    product.styles.join(" "),
    product.fit,
    product.audience,
  ]
    .join(" ")
    .toLowerCase();

  let score = 0;
  const tokens = raw
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t) && !/^\d+$/.test(t));

  for (const token of tokens) {
    if (haystack.includes(token)) score += 6;
  }
  if (interpreted.categories.includes(product.category)) score += 20;
  if (interpreted.colors.some((c) => product.colors.includes(c))) score += 14;
  if (interpreted.styles.some((s) => product.styles.includes(s))) score += 14;
  if (interpreted.fit && product.fit === interpreted.fit) score += 8;
  if (interpreted.occasion && product.occasions.includes(interpreted.occasion)) score += 10;
  if (interpreted.audience && (product.audience === interpreted.audience || product.audience === "unisex")) score += 8;
  return score;
}

export function filterProducts(products: Product[], filters: ProductFilters): Product[] {
  let result = [...products];

  if (filters.audiences?.length) {
    result = result.filter(
      (p) => filters.audiences!.includes(p.audience) || p.audience === "unisex",
    );
  }
  if (filters.categories?.length) result = result.filter((p) => filters.categories!.includes(p.category));
  if (filters.brands?.length) result = result.filter((p) => filters.brands!.includes(p.brand));
  if (filters.colors?.length)
    result = result.filter((p) => p.colors.some((c) => filters.colors!.includes(c)));
  if (filters.styles?.length)
    result = result.filter((p) => p.styles.some((s) => filters.styles!.includes(s)));
  if (typeof filters.minPrice === "number") result = result.filter((p) => p.price >= filters.minPrice!);
  if (typeof filters.maxPrice === "number") result = result.filter((p) => p.price <= filters.maxPrice!);
  if (filters.sponsoredOnly) result = result.filter((p) => p.sponsored);
  if (filters.q?.trim()) {
    const interpreted = interpretQuery(filters.q);
    if (interpreted.maxPrice) result = result.filter((p) => p.price <= interpreted.maxPrice!);
    if (interpreted.minPrice) result = result.filter((p) => p.price >= interpreted.minPrice!);
    if (interpreted.colors.length)
      result = result.filter((p) => p.colors.some((c) => interpreted.colors.includes(c)));
    result = result
      .map((p) => ({ p, score: relevance(p, interpreted, filters.q!) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ p }) => p);
  }

  switch (filters.sort) {
    case "price-asc":
      result.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      result.sort((a, b) => b.price - a.price);
      break;
    case "newest":
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case "popularity":
      result.sort((a, b) => b.popularity - a.popularity);
      break;
    case "discount":
      result.sort((a, b) => b.mrp - b.price - (a.mrp - a.price));
      break;
    default:
      if (!filters.q) result.sort((a, b) => b.popularity - a.popularity);
  }
  return result;
}

export function applyInterpretation(interpreted: InterpretedQuery): ProductFilters {
  return {
    categories: interpreted.categories,
    styles: interpreted.styles,
    colors: interpreted.colors,
    maxPrice: interpreted.maxPrice ?? undefined,
    minPrice: interpreted.minPrice ?? undefined,
    audiences: interpreted.audience ? [interpreted.audience] : undefined,
  };
}

export function relatedProducts(product: Product, products: Product[], limit = 4): Product[] {
  return products
    .filter((p) => p.id !== product.id)
    .map((p) => {
      let score = 0;
      if (p.category === product.category) score += 8;
      if (p.brand === product.brand) score += 5;
      if (p.audience === product.audience) score += 3;
      score += p.styles.filter((s) => product.styles.includes(s)).length * 4;
      score += p.colors.filter((c) => product.colors.includes(c)).length * 2;
      return { p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ p }) => p);
}

export function completeTheLook(product: Product, products: Product[], limit = 3): Product[] {
  const roleMap: Record<string, string[]> = {
    "T-Shirts": ["Jeans", "Trousers", "Shoes", "Accessories", "Jackets"],
    Shirts: ["Trousers", "Jeans", "Shoes", "Accessories"],
    Jeans: ["T-Shirts", "Shirts", "Shoes", "Jackets"],
    Trousers: ["Shirts", "T-Shirts", "Shoes", "Accessories"],
    Hoodies: ["Jeans", "Shoes", "Accessories"],
    Jackets: ["T-Shirts", "Jeans", "Shoes"],
    Dresses: ["Shoes", "Accessories", "Jackets"],
    Shoes: ["Jeans", "T-Shirts", "Accessories"],
    Accessories: ["T-Shirts", "Jeans", "Shoes"],
    "Ethnic Wear": ["Accessories", "Shoes"],
  };
  const targets = roleMap[product.category] ?? ["Accessories"];
  const pool = products.filter(
    (p) => p.id !== product.id && targets.includes(p.category) && p.price <= product.price * 1.6,
  );
  const picked: Product[] = [];
  for (const category of targets) {
    const match = pool.find(
      (p) => p.category === category && !picked.includes(p) && (p.audience === product.audience || p.audience === "unisex"),
    );
    if (match) picked.push(match);
  }
  return picked.slice(0, limit);
}
