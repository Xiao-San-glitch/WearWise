import type {
  OutfitItemView,
  OutfitRecommendation,
  Product,
  StylistPreferences,
} from "./types";

type Role = "top" | "bottom" | "footwear" | "layer" | "accessory" | "onepiece";

const ROLE_MAP: Record<string, Role> = {
  "T-Shirts": "top",
  Shirts: "top",
  Hoodies: "top",
  Jeans: "bottom",
  Trousers: "bottom",
  Dresses: "onepiece",
  "Ethnic Wear": "onepiece",
  Jackets: "layer",
  Shoes: "footwear",
  Accessories: "accessory",
};

export function roleOf(product: Product): Role {
  return ROLE_MAP[product.category] ?? "accessory";
}

const KEYWORD_COLORS = [
  "black", "white", "cream", "beige", "grey", "navy", "blue", "indigo",
  "olive", "wine", "tan", "red", "green", "pink", "orange", "gold", "brown",
];

function instructionBonus(product: Product, prefs: StylistPreferences): number {
  const text = prefs.instructions.toLowerCase();
  if (!text) return 0;
  let bonus = 0;
  for (const color of KEYWORD_COLORS) {
    if (text.includes(color) && product.colors.some((c) => c.toLowerCase() === color)) bonus += 7;
  }
  if (/\b(oversized|boxy|loose)\b/.test(text) && product.fit === "oversized") bonus += 6;
  if (/\b(slim|fitted|tailored)\b/.test(text) && product.fit === "slim") bonus += 6;
  if (text.includes("shoe") || text.includes("sneaker")) bonus += roleOf(product) === "footwear" ? 6 : 0;
  if (text.includes("accessor")) bonus += roleOf(product) === "accessory" ? 5 : 0;
  if (text.includes("layering") || text.includes("layer")) bonus += roleOf(product) === "layer" ? 5 : 0;
  return bonus;
}

export function scoreProduct(product: Product, prefs: StylistPreferences): number {
  if (product.audience !== "unisex" && product.audience !== prefs.audience) return -999;
  let score = 0;
  score += product.audience === prefs.audience ? 12 : 7;
  if (prefs.style && product.styles.some((s) => s.toLowerCase() === prefs.style.toLowerCase())) score += 26;
  if (prefs.occasion && product.occasions.some((o) => o.toLowerCase() === prefs.occasion.toLowerCase())) score += 14;
  const colorHits = product.colors.filter((c) =>
    prefs.colors.some((pc) => pc.toLowerCase() === c.toLowerCase()),
  ).length;
  score += Math.min(colorHits, 2) * 9;
  if (prefs.fit && product.fit === prefs.fit) score += 9;
  if (prefs.season && (product.seasons.includes(prefs.season) || product.seasons.includes("All-season"))) score += 5;
  if (prefs.categories.length && prefs.categories.includes(product.category)) score += 14;
  if (prefs.categories.length && !prefs.categories.includes(product.category)) score -= 4;
  score += product.rating * 3.2;
  score += product.popularity * 0.07;
  score += instructionBonus(product, prefs);
  return score;
}

function toView(product: Product): OutfitItemView {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    price: product.price,
    mrp: product.mrp,
    color: product.colors[0] ?? "",
    category: product.category,
    image: product.image,
    retailer: product.retailer,
    sizes: product.sizes,
    affiliateUrl: product.affiliateUrl,
    styles: product.styles,
  };
}

const TITLE_BY_STYLE: Record<string, string[]> = {
  Streetwear: ["Off-Duty Street Edit", "Concrete & Cotton", "Weekend Street Set"],
  Minimalist: ["Quiet Minimal Set", "Less, But Better", "Clean Line Edit"],
  "Old Money": ["Quiet Luxury Look", "Heritage Ease", "Country Club Casual"],
  Casual: ["Everyday Ease", "Easy Sunday Set", "Soft Casual Edit"],
  Formal: ["Sharp Tailored Look", "After Hours Formal", "Boardroom Edit"],
  Sporty: ["Clean Sport Set", "Weekend Athleisure", "Motion First"],
  Traditional: ["Modern Traditional", "Festive Craft Edit", "Loom & Light"],
  Aesthetic: ["Soft Aesthetic Set", "Editorial Everyday", "Dreamy Layer Edit"],
};

const OCCASION_TITLE: Record<string, string> = {
  College: "Campus Series",
  Casual: "Everyday Series",
  Party: "After Dark",
  Wedding: "Celebration Edit",
  Office: "Nine to Six",
  Date: "Dinner Edit",
  Travel: "Carry-On Edit",
};

function buildTitle(prefs: StylistPreferences, index: number): string {
  const styles = TITLE_BY_STYLE[prefs.style] ?? ["WearWise Edit", "Considered Set", "Studio Look"];
  const base = styles[index % styles.length];
  const occasion = OCCASION_TITLE[prefs.occasion];
  return index === 0 && occasion ? `${base} · ${occasion}` : base;
}

function buildRationale(
  prefs: StylistPreferences,
  items: Product[],
  total: number,
): string {
  const names = items.map((i) => i.name);
  const lead = items[0];
  const remaining = prefs.budget - total;
  const parts: string[] = [];
  parts.push(
    `We anchored this look on the ${lead.name} in ${lead.colors[0]} — it carries the ${prefs.style.toLowerCase()} mood you asked for${
      prefs.occasion ? ` and reads right for ${prefs.occasion.toLowerCase()}` : ""
    }.`,
  );
  if (names.length > 1) {
    parts.push(
      `The ${names.slice(1, 3).join(" and ")} keep the palette ${prefs.colors.length ? prefs.colors.slice(0, 2).join(" and ").toLowerCase() : "balanced"}${
        items.some((i) => i.fit === prefs.fit) ? ` and match your ${prefs.fit} fit preference` : ""
      }.`,
    );
  }
  parts.push(
    remaining >= 0
      ? `The full outfit comes to ₹${total.toLocaleString("en-IN")} — ₹${remaining.toLocaleString("en-IN")} inside your ₹${prefs.budget.toLocaleString("en-IN")} budget.`
      : `This set comes to ₹${total.toLocaleString("en-IN")} against your ₹${prefs.budget.toLocaleString("en-IN")} budget, so swap the denim for something lighter if you want to stay under.`,
  );
  return parts.join(" ");
}

function buildTip(prefs: StylistPreferences, items: Product[]): string {
  const hasLayer = items.some((i) => roleOf(i) === "layer");
  const hasFootwear = items.some((i) => roleOf(i) === "footwear");
  const tips = [
    "Keep the palette to two neutrals and let the fit do the talking.",
    "Half-tuck the top and cuff the hem once — it changes the proportion instantly.",
    hasLayer
      ? "Wear the layer open with the sleeves pushed up for a relaxed silhouette."
      : "Add a thin belt or a single piece of jewellery to finish the look without clutter.",
    hasFootwear
      ? "Match your footwear to the darkest tone in the outfit for a longer, cleaner line."
      : "Neutral leather sandals will keep this look light and intentional.",
    prefs.season === "Winter"
      ? "Layer a fine merino knit underneath on colder evenings."
      : "Choose breathable fabrics and loose layering for humid days.",
  ];
  return tips[Math.min(items.length, tips.length) - 1] ?? tips[0];
}

type Composer = {
  prefs: StylistPreferences;
  pool: Product[];
  usedSignatures: Set<string>;
};

function pickBest(
  composer: Composer,
  roles: Role[],
  maxPrice: number,
  skip = 0,
): Product | null {
  const candidates = composer.pool
    .filter((p) => roles.includes(roleOf(p)) && p.price <= maxPrice)
    .sort((a, b) => scoreProduct(b, composer.prefs) - scoreProduct(a, composer.prefs));
  return candidates[skip] ?? candidates[0] ?? null;
}

/** Only add a finishing accessory when it actually matches the brief. */
function pickMatchingAccessory(composer: Composer, maxPrice: number): Product | null {
  const { prefs } = composer;
  const candidates = composer.pool
    .filter((p) => roleOf(p) === "accessory" && p.price <= maxPrice)
    .sort((a, b) => scoreProduct(b, prefs) - scoreProduct(a, prefs));
  const match = candidates.find(
    (product) =>
      product.styles.some((style) => style.toLowerCase() === prefs.style.toLowerCase()) ||
      product.occasions.some((occasion) => occasion.toLowerCase() === prefs.occasion.toLowerCase()),
  );
  return match ?? null;
}

function buildWithAnchor(
  composer: Composer,
  anchor: Product,
): { items: Product[]; total: number } | null {
  const { prefs } = composer;

  const complete = (base: Product[]) => {
    const items = [...base];
    let remaining = prefs.budget - items.reduce((sum, item) => sum + item.price, 0);

    const addRole = (roles: Role[]) => {
      const found = pickBest(composer, roles, remaining, 0);
      if (found) {
        items.push(found);
        remaining -= found.price;
        return true;
      }
      return false;
    };

    addRole(["footwear"]);
    if (prefs.season === "Winter" || prefs.style === "Formal" || prefs.style === "Old Money") {
      addRole(["layer"]);
    }
    const accessory = pickMatchingAccessory(composer, remaining);
    if (accessory) {
      items.push(accessory);
      remaining -= accessory.price;
    }

    if (items.length < 2) return null;
    const total = items.reduce((sum, item) => sum + item.price, 0);
    if (total > prefs.budget) return null;
    return { items, total };
  };

  if (roleOf(anchor) === "onepiece") {
    const option = complete([anchor]);
    return option;
  }

  const remainingAfterAnchor = prefs.budget - anchor.price;
  const bottoms = composer.pool
    .filter(
      (product) =>
        roleOf(product) === "bottom" &&
        product.price <= remainingAfterAnchor &&
        product.id !== anchor.id,
    )
    .sort((a, b) => scoreProduct(b, prefs) - scoreProduct(a, prefs))
    .slice(0, 6);

  if (!bottoms.length) return complete([anchor]);

  let best: { items: Product[]; total: number; score: number } | null = null;
  for (const bottom of bottoms) {
    const option = complete([anchor, bottom]);
    if (!option) continue;
    const score = compositionScore(option.items, prefs);
    if (!best || score > best.score) best = { ...option, score };
  }
  if (!best) return null;
  return { items: best.items, total: best.total };
}

/**
 * A complete look beats a cheaper but incomplete one: shoes and a bottom
 * carry more weight than an accessory. This also nudges the engine toward a
 * slightly less expensive anchor when that is what makes a full outfit fit
 * inside the budget.
 */
function compositionScore(items: Product[], prefs: StylistPreferences): number {
  let score = items.reduce((sum, item) => sum + scoreProduct(item, prefs), 0);
  const roles = new Set(items.map(roleOf));
  if (roles.has("footwear")) score += 120;
  if (roles.has("bottom") || roles.has("onepiece")) score += 30;
  if (roles.has("layer")) score += 10;
  if (roles.has("accessory")) score += 6;
  score += items.length * 4;
  return score;
}

function composeOnce(composer: Composer): { items: Product[]; total: number } | null {
  const { prefs } = composer;
  const wantsOnePiece =
    (prefs.style === "Traditional" || prefs.occasion === "Wedding" || prefs.categories.includes("Ethnic Wear") || prefs.categories.includes("Dresses")) &&
    prefs.audience !== "men";

  const anchorRoles: Role[] = wantsOnePiece ? ["onepiece"] : ["top", "onepiece"];
  const anchors = composer.pool
    .filter((product) => anchorRoles.includes(roleOf(product)))
    .sort((a, b) => scoreProduct(b, prefs) - scoreProduct(a, prefs));

  let best: { items: Product[]; total: number; score: number; signature: string } | null = null;
  for (const anchor of anchors) {
    const composed = buildWithAnchor(composer, anchor);
    if (!composed) continue;
    const signature = composed.items.map((item) => item.id).sort().join("-");
    if (composer.usedSignatures.has(signature)) continue;
    const score = compositionScore(composed.items, prefs);
    if (!best || score > best.score) best = { ...composed, score, signature };
  }

  if (!best) return null;
  composer.usedSignatures.add(best.signature);
  return { items: best.items, total: best.total };
}

export function buildOutfits(prefs: StylistPreferences, products: Product[]): OutfitRecommendation[] {
  const eligible = products.filter(
    (p) =>
      p.price <= prefs.budget &&
      p.stock > 0 &&
      (p.audience === "unisex" || p.audience === prefs.audience),
  );

  const composer: Composer = { prefs, pool: eligible, usedSignatures: new Set() };
  const outfits: OutfitRecommendation[] = [];
  const seen = new Set<string>();

  for (let variant = 0; variant < 6 && outfits.length < 3; variant += 1) {
    const composed = composeOnce(composer);
    if (!composed) continue;
    const signature = composed.items.map((i) => i.id).sort().join("-");
    if (seen.has(signature)) continue;
    seen.add(signature);
    outfits.push({
      id: `look_${outfits.length + 1}_${signature}`,
      title: buildTitle(prefs, outfits.length),
      rationale: buildRationale(prefs, composed.items, composed.total),
      stylingTip: buildTip(prefs, composed.items),
      items: composed.items.map(toView),
      total: composed.total,
    });
  }

  // Very tight budgets: surface the strongest affordable pieces so the user
  // still gets a usable edit instead of an empty page.
  if (!outfits.length) {
    const affordable = eligible
      .sort((a, b) => scoreProduct(b, prefs) - scoreProduct(a, prefs))
      .slice(0, 3);
    if (affordable.length) {
      outfits.push({
        id: `look_essentials`,
        title: "Budget Edit · Start Here",
        rationale: `A complete outfit doesn't fit inside ₹${prefs.budget.toLocaleString("en-IN")} at the moment, so we picked the strongest single pieces you can buy now. Add the rest of the look as your budget grows.`,
        stylingTip: "Buy the anchor piece first — it's the one you'll wear most.",
        items: affordable.map(toView),
        total: affordable[0].price,
      });
    }
  }

  return outfits;
}

export function summarize(prefs: StylistPreferences, outfits: OutfitRecommendation[]): string {
  if (!outfits.length) {
    return `Nothing in the catalogue fits a ₹${prefs.budget.toLocaleString("en-IN")} budget yet. Try a higher budget and we'll style a full look.`;
  }
  return `${outfits.length} ${
    outfits.length === 1 ? "look" : "looks"
  } built for ${prefs.occasion.toLowerCase()} in a ${prefs.style.toLowerCase()} direction, all within ₹${prefs.budget.toLocaleString(
    "en-IN",
  )}.`;
}

export function validateOutfits(
  raw: unknown,
  prefs: StylistPreferences,
  products: Product[],
): OutfitRecommendation[] {
  if (!Array.isArray(raw)) return [];
  const byId = new Map(products.map((p) => [p.id, p]));
  const results: OutfitRecommendation[] = [];
  for (const entry of raw.slice(0, 3)) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    const ids = Array.isArray(record.items) ? (record.items as unknown[]) : [];
    const items = ids
      .map((id) => byId.get(String(id)))
      .filter((p): p is Product => Boolean(p?.id));
    if (items.length < 2) continue;
    const total = items.reduce((sum, item) => sum + item.price, 0);
    if (total > prefs.budget) continue;
    results.push({
      id: `look_ai_${results.length + 1}`,
      title: typeof record.title === "string" && record.title.trim() ? record.title.trim().slice(0, 70) : "AI Styled Look",
      rationale:
        typeof record.rationale === "string" && record.rationale.trim()
          ? record.rationale.trim().slice(0, 700)
          : buildRationale(prefs, items, total),
      stylingTip:
        typeof record.stylingTip === "string" && record.stylingTip.trim()
          ? record.stylingTip.trim().slice(0, 280)
          : buildTip(prefs, items),
      items: items.map(toView),
      total,
    });
  }
  return results;
}

export function calculateTotal(items: { price: number }[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

export function parseBudget(input: { budget?: string; customBudget?: number }): {
  max: number;
  label: string;
} {
  if (input.customBudget && input.customBudget > 0) {
    return { max: Math.round(input.customBudget), label: `Up to ₹${input.customBudget.toLocaleString("en-IN")}` };
  }
  const map: Record<string, { max: number; label: string }> = {
    "500-1000": { max: 1000, label: "₹500 – ₹1,000" },
    "1000-2000": { max: 2000, label: "₹1,000 – ₹2,000" },
    "2000-5000": { max: 5000, label: "₹2,000 – ₹5,000" },
    "5000+": { max: 12000, label: "₹5,000+" },
  };
  return map[input.budget ?? ""] ?? { max: 3000, label: "Up to ₹3,000" };
}

/* ---------------------------------------------------------------------- */
/* Chat fallback                                                          */
/* ---------------------------------------------------------------------- */

const CHAT_INTENTS: { test: RegExp; occasion?: string; style?: string; category?: string; label: string }[] = [
  { test: /college|campus|class/i, occasion: "College", label: "college" },
  { test: /office|work|interview|business/i, occasion: "Office", style: "Formal", label: "the office" },
  { test: /wedding|shaadi|sangeet|reception/i, occasion: "Wedding", style: "Traditional", label: "a wedding" },
  { test: /party|club|night out/i, occasion: "Party", label: "a party" },
  { test: /date|dinner/i, occasion: "Date", label: "a date" },
  { test: /travel|trip|vacation|flight/i, occasion: "Travel", label: "travel" },
  { test: /minimal|clean|simple/i, style: "Minimalist", label: "a minimalist look" },
  { test: /street|urban|skate/i, style: "Streetwear", label: "streetwear" },
  { test: /old money|quiet luxury|classic/i, style: "Old Money", label: "an old-money look" },
];

export function answerChat(
  message: string,
  products: Product[],
): { message: string; productIds: string[]; source: "fallback" } {
  const text = message.toLowerCase();
  const budgetMatch = text.match(/(?:under|below|within|₹|rs\.?|inr)\s*₹?\s*([\d,]{3,7})/);
  const budget = budgetMatch ? Number(budgetMatch[1].replace(/,/g, "")) : 5000;
  const color = KEYWORD_COLORS.find((c) => text.includes(c));
  const intent = CHAT_INTENTS.find((i) => i.test.test(text));

  const prefs: StylistPreferences = {
    audience: /women|woman|female|dress|saree|sari|gown/i.test(text) ? "women" : /men|man|male|shirt/i.test(text) ? "men" : "unisex",
    budget,
    budgetLabel: `Up to ₹${budget}`,
    occasion: intent?.occasion ?? "Casual",
    style: intent?.style ?? "Minimalist",
    colors: color ? [color.charAt(0).toUpperCase() + color.slice(1)] : [],
    season: "All-season",
    categories: [],
    fit: "",
    instructions: message,
  };

  const pool = products.filter((p) => p.price <= budget);
  const ranked = [...pool]
    .sort((a, b) => scoreProduct(b, prefs) - scoreProduct(a, prefs))
    .slice(0, 4);

  if (!ranked.length) {
    return {
      message: `I couldn't find pieces under ₹${budget.toLocaleString("en-IN")} in the catalogue. Try a slightly higher budget or tell me which category you're shopping for.`,
      productIds: [],
      source: "fallback",
    };
  }

  const list = ranked
    .slice(0, 3)
    .map((p) => `${p.name} by ${p.brand} (₹${p.price.toLocaleString("en-IN")})`)
    .join(", ");

  const opener = intent
    ? `For ${intent.label}, I'd keep the palette tight and let the silhouette do the work.`
    : "Here's a direction I'd take based on what you've described.";

  return {
    message: `${opener} Start with ${list}. Everything here sits under ₹${budget.toLocaleString("en-IN")}, so you can build a full look without stretching. ${
      color ? `I kept ${color} as the anchor colour — it's easy to layer with cream, grey or black.` : "Stick to two neutrals and one accent, and the outfit will feel intentional."
    } Want me to build a complete outfit around one of these? Open the AI Stylist and I'll put the full look together.`,
    productIds: ranked.map((p) => p.id),
    source: "fallback",
  };
}
