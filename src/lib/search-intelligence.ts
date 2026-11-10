import { isGeminiConfigured, parseSearchWithGemini } from "./gemini";
import { interpretQuery, type InterpretedQuery } from "./search";
import { COLORS, STYLES, CATEGORIES } from "./seed";

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

/**
 * Interprets a natural-language query. Uses Gemini when a key is configured,
 * always falling back to the deterministic local parser.
 */
export async function interpretSearch(query: string): Promise<InterpretedQuery> {
  const local = interpretQuery(query);
  if (!isGeminiConfigured()) return local;

  const ai = await parseSearchWithGemini(query);
  if (!ai) return local;

  const categoryNames = CATEGORIES.map((category) => category.name);
  const categories = toStringArray(ai.categories).filter((value) => categoryNames.includes(value));
  const colors = toStringArray(ai.colors).filter((value) => COLORS.includes(value));
  const styles = toStringArray(ai.styles).filter((value) => STYLES.includes(value));
  const audience = typeof ai.audience === "string" && ["men", "women", "unisex"].includes(ai.audience)
    ? ai.audience
    : null;

  const merged: InterpretedQuery = {
    categories: categories.length ? categories : local.categories,
    colors: colors.length ? colors : local.colors,
    styles: styles.length ? styles : local.styles,
    audience: audience ?? local.audience,
    maxPrice: typeof ai.maxPrice === "number" ? ai.maxPrice : local.maxPrice,
    minPrice: typeof ai.minPrice === "number" ? ai.minPrice : local.minPrice,
    fit: local.fit,
    occasion: local.occasion,
    keywords: query.trim(),
    source: "ai",
  };

  return merged;
}
