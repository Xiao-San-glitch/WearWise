import type {
  GeneratedWardrobeOutfit,
  MissingItemRecommendation,
  Product,
  WardrobeAssistantReply,
  WardrobeAudience,
  WardrobeCategory,
  WardrobeItem,
  WardrobeOutfit,
  WardrobePreferences,
  WardrobeSlot,
} from "./types";

/* -------------------------------------------------------------------------- */
/* Vocabulary                                                                  */
/* -------------------------------------------------------------------------- */

export const WARDROBE_CATEGORIES: WardrobeCategory[] = [
  "Tops",
  "Shirts",
  "T-shirts",
  "Pants",
  "Jeans",
  "Shorts",
  "Jackets",
  "Shoes",
  "Accessories",
  "Ethnic wear",
];

export const WARDROBE_STYLES = [
  "Minimal",
  "Streetwear",
  "Formal",
  "Casual",
  "Traditional",
  "Smart Casual",
] as const;

export const WARDROBE_SEASONS = ["Summer", "Monsoon", "Winter", "All-season"] as const;

export const WARDROBE_AUDIENCES: WardrobeAudience[] = ["Unisex", "Men", "Women"];

export const WARDROBE_OCCASIONS = [
  "College",
  "Casual",
  "Party",
  "Office",
  "Interview",
  "Wedding",
  "Date",
  "Travel",
] as const;

export const WARDROBE_COLORS = [
  "Black",
  "White",
  "Cream",
  "Beige",
  "Grey",
  "Navy",
  "Blue",
  "Indigo",
  "Olive",
  "Wine",
  "Tan",
  "Red",
  "Green",
  "Pink",
  "Orange",
  "Brown",
  "Multicolour",
];

export const OUTFIT_TYPES: { value: WardrobePreferences["outfitType"]; label: string; hint: string }[] = [
  { value: "complete", label: "Complete outfit", hint: "Top, bottom, shoes and any layer that helps" },
  { value: "smart-casual", label: "Smart casual", hint: "Clean top, tailored bottom, real shoes" },
  { value: "layered", label: "Layered look", hint: "Built to show off a jacket" },
  { value: "minimal", label: "Top, bottom & shoes", hint: "The shortest route to a finished outfit" },
];

const NEUTRALS = new Set(["Black", "White", "Cream", "Beige", "Grey", "Navy", "Tan", "Brown"]);

const OCCASION_STYLES: Record<string, string[]> = {
  College: ["Casual", "Streetwear", "Minimal"],
  Casual: ["Casual", "Minimal", "Streetwear"],
  Party: ["Streetwear", "Smart Casual", "Formal"],
  Office: ["Formal", "Smart Casual", "Minimal"],
  Interview: ["Formal", "Smart Casual", "Minimal"],
  Wedding: ["Traditional", "Formal", "Smart Casual"],
  Date: ["Smart Casual", "Minimal", "Formal"],
  Travel: ["Casual", "Minimal", "Streetwear"],
};

const PRODUCT_SLOTS: Record<string, WardrobeSlot> = {
  "T-Shirts": "top",
  Shirts: "top",
  Dresses: "top",
  "Ethnic Wear": "top",
  Trousers: "bottom",
  Jeans: "bottom",
  Shorts: "bottom",
  Hoodies: "layer",
  Jackets: "layer",
  Shoes: "shoes",
  Accessories: "accessory",
};

const TITLE_NOUNS = ["Edit", "Pairing", "Set"];

/* -------------------------------------------------------------------------- */
/* Small helpers                                                               */
/* -------------------------------------------------------------------------- */

export function slotOf(category: string): WardrobeSlot {
  switch (category) {
    case "Tops":
    case "Shirts":
    case "T-shirts":
    case "Ethnic wear":
      return "top";
    case "Pants":
    case "Jeans":
    case "Shorts":
      return "bottom";
    case "Jackets":
      return "layer";
    case "Shoes":
      return "shoes";
    case "Accessories":
      return "accessory";
    default:
      return "top";
  }
}

export function slotLabel(slot: WardrobeSlot): string {
  return { top: "top", bottom: "bottom", layer: "layer", shoes: "shoes", accessory: "accessory" }[slot];
}

export function productSlot(product: Pick<Product, "category">): WardrobeSlot {
  return PRODUCT_SLOTS[product.category] ?? "accessory";
}

function normalizeStyle(style: string): string {
  const value = style.toLowerCase();
  if (value.includes("minimal")) return "Minimal";
  if (value.includes("street")) return "Streetwear";
  if (value.includes("formal")) return "Formal";
  if (value.includes("traditional") || value.includes("ethnic")) return "Traditional";
  if (value.includes("smart") || value.includes("old money") || value.includes("aesthetic")) return "Smart Casual";
  return "Casual";
}

function audienceMatches(audience: WardrobeAudience | "Any", item: WardrobeAudience | Product["audience"]): boolean {
  if (audience === "Any") return true;
  if (item === "Unisex" || item === "unisex") return true;
  if (audience === "Unisex") return true;
  return item.toLowerCase() === audience.toLowerCase();
}

function seasonMatches(a: string, b: string): boolean {
  return a === "All-season" || b === "All-season" || a === b;
}

function colorsWork(a: string, b: string): boolean {
  return a === b || NEUTRALS.has(a) || NEUTRALS.has(b);
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                  */
/* -------------------------------------------------------------------------- */

export interface WardrobeItemInput {
  name: string;
  category: WardrobeCategory;
  color: string;
  brand: string;
  price: number;
  size: string;
  style: string;
  season: string;
  audience: WardrobeAudience;
  image: string;
  notes: string;
}

export function validateWardrobeItem(body: unknown): { ok: true; value: WardrobeItemInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid request body." };
  const input = body as Record<string, unknown>;

  const name = String(input.name ?? "").trim();
  if (name.length < 2) return { ok: false, error: "Give the piece a name (at least 2 characters)." };
  if (name.length > 80) return { ok: false, error: "Keep item names under 80 characters." };

  const category = String(input.category ?? "");
  if (!WARDROBE_CATEGORIES.includes(category as WardrobeCategory)) {
    return { ok: false, error: "Choose a valid clothing category." };
  }

  const color = String(input.color ?? "");
  if (!WARDROBE_COLORS.includes(color)) return { ok: false, error: "Choose a colour from the list." };

  const brand = String(input.brand ?? "").trim().slice(0, 40);
  const size = String(input.size ?? "").trim().slice(0, 12);
  const price = Math.round(Number(input.price));
  if (!Number.isFinite(price) || price < 0 || price > 200000) {
    return { ok: false, error: "Price must be between ₹0 and ₹2,00,000." };
  }

  const style = String(input.style ?? "");
  if (!WARDROBE_STYLES.includes(style as (typeof WARDROBE_STYLES)[number])) {
    return { ok: false, error: "Choose a valid style." };
  }

  const season = String(input.season ?? "");
  if (!WARDROBE_SEASONS.includes(season as (typeof WARDROBE_SEASONS)[number])) {
    return { ok: false, error: "Choose a valid season." };
  }

  const audience = String(input.audience ?? "Unisex") as WardrobeAudience;
  if (!WARDROBE_AUDIENCES.includes(audience)) return { ok: false, error: "Choose Men, Women or Unisex." };

  const image = String(input.image ?? "").trim();
  if (image && !/^\/(uploads\/wardrobe|products)\/[\w./-]+$/.test(image)) {
    return { ok: false, error: "That image path is not allowed." };
  }

  const notes = String(input.notes ?? "").trim().slice(0, 200);

  return {
    ok: true,
    value: { name, category: category as WardrobeCategory, color, brand, price, size, style, season, audience, image, notes },
  };
}

export function normalizePreferences(body: unknown): WardrobePreferences {
  const input = (body ?? {}) as Record<string, unknown>;
  const occasion = String(input.occasion ?? "Casual");
  const style = String(input.style ?? "Minimal");
  const color = String(input.color ?? "Any");
  const season = String(input.season ?? "All-season");
  const audience = String(input.audience ?? "Any") as WardrobePreferences["audience"];
  const outfitType = String(input.outfitType ?? "complete") as WardrobePreferences["outfitType"];

  return {
    occasion: (WARDROBE_OCCASIONS as readonly string[]).includes(occasion) ? occasion : "Casual",
    style: (WARDROBE_STYLES as readonly string[]).includes(style) ? style : "Minimal",
    color,
    season: (WARDROBE_SEASONS as readonly string[]).includes(season) ? season : "All-season",
    audience: WARDROBE_AUDIENCES.includes(audience as WardrobeAudience) ? audience : "Any",
    outfitType: OUTFIT_TYPES.some((entry) => entry.value === outfitType) ? outfitType : "complete",
  };
}

/* -------------------------------------------------------------------------- */
/* Outfit generation                                                           */
/* -------------------------------------------------------------------------- */

function scoreItem(item: WardrobeItem, prefs: WardrobePreferences): number {
  let score = 0;
  if (item.style === prefs.style) score += 4;
  if (OCCASION_STYLES[prefs.occasion]?.includes(item.style)) score += 3;
  if (prefs.color !== "Any" && item.color === prefs.color) score += 3;
  else if (NEUTRALS.has(item.color)) score += 1.5;
  if (seasonMatches(item.season, prefs.season)) score += 1.5;
  if (item.audience === "Unisex" || item.audience === prefs.audience) score += 0.5;
  return score;
}

function pickBest(candidates: WardrobeItem[], prefs: WardrobePreferences, exclude: Set<string>): WardrobeItem | undefined {
  return candidates
    .filter((item) => !exclude.has(item.id))
    .sort((a, b) => scoreItem(b, prefs) - scoreItem(a, prefs))[0];
}

function scoreLook(items: WardrobeItem[], prefs: WardrobePreferences): number {
  const slots = new Set(items.map((item) => slotOf(item.category)));
  let structure = 0;
  if (slots.has("top")) structure += 14;
  if (slots.has("bottom")) structure += 14;
  if (slots.has("shoes")) structure += 12;
  if (slots.has("layer")) structure += 4;

  const styleMatches = items.filter((item) => item.style === prefs.style).length;
  const occasionMatches = items.filter((item) => OCCASION_STYLES[prefs.occasion]?.includes(item.style)).length;
  const colorMatches = items.filter(
    (item) => (prefs.color !== "Any" && item.color === prefs.color) || NEUTRALS.has(item.color),
  ).length;
  const seasonHits = items.filter((item) => seasonMatches(item.season, prefs.season)).length;

  const styleScore = items.length ? (styleMatches / items.length) * 25 : 0;
  const occasionScore = items.length ? (occasionMatches / items.length) * 20 : 0;
  const colorScore = items.length ? (colorMatches / items.length) * 10 : 0;
  const seasonScore = items.length ? (seasonHits / items.length) * 5 : 0;

  return Math.round(clamp(structure + styleScore + occasionScore + colorScore + seasonScore));
}

function buildWhy(items: WardrobeItem[], prefs: WardrobePreferences): string {
  const top = items.find((item) => slotOf(item.category) === "top");
  const bottom = items.find((item) => slotOf(item.category) === "bottom");
  const shoes = items.find((item) => slotOf(item.category) === "shoes");
  const layer = items.find((item) => slotOf(item.category) === "layer");
  const reasons: string[] = [];

  const sharedStyle = items.length
    ? items
        .map((item) => item.style)
        .filter((style, index, all) => all.indexOf(style) === index)
        .slice(0, 2)
    : [];
  if (sharedStyle.length === 1 && sharedStyle[0] === prefs.style) {
    reasons.push(`Every piece sits in the ${prefs.style.toLowerCase()} lane, so the proportions read as one outfit.`);
  } else if (sharedStyle.length) {
    reasons.push(`A ${sharedStyle.join(" / ").toLowerCase()} mix that stays coherent because the shapes are simple.`);
  }

  if (top && bottom) {
    if (top.color === bottom.color) {
      reasons.push(`The tonal ${top.color.toLowerCase()} top and bottom make the look feel deliberate; ${shoes ? `the ${shoes.color.toLowerCase()} shoes add the break` : "keep the shoes low-contrast"}.`);
    } else if (NEUTRALS.has(top.color) && NEUTRALS.has(bottom.color)) {
      reasons.push(`Warm neutrals (${top.color.toLowerCase()} and ${bottom.color.toLowerCase()}) give you one clean palette instead of competing colours.`);
    } else {
      reasons.push(`${top.color} on top and ${bottom.color.toLowerCase()} below gives one point of contrast, which is enough.`);
    }
  }

  if (layer) reasons.push(`The ${layer.color.toLowerCase()} ${layer.name.toLowerCase()} adds structure without hiding the base layer.`);
  if (shoes) reasons.push(`You already own the ${shoes.name.toLowerCase()}, so the fit and comfort are proven.`);

  reasons.push(
    `It covers ${prefs.occasion.toLowerCase()} because ${OCCASION_STYLES[prefs.occasion]?.slice(0, 2).join(" and ").toLowerCase()} is what the room expects.`,
  );

  return reasons.join(" ");
}

function buildDescription(items: WardrobeItem[], prefs: WardrobePreferences): string {
  const top = items.find((item) => slotOf(item.category) === "top");
  const bottom = items.find((item) => slotOf(item.category) === "bottom");
  const shoes = items.find((item) => slotOf(item.category) === "shoes");
  return `${prefs.style} ${prefs.occasion.toLowerCase()} outfit built around your ${
    top?.name.toLowerCase() ?? "top"
  } and ${bottom?.name.toLowerCase() ?? "bottom"}${shoes ? `, finished with the ${shoes.name.toLowerCase()}` : ""}.`;
}

function buildSuitability(score: number, occasion: string): string {
  return score >= 80
    ? `${occasion} · strong match`
    : score >= 60
      ? `${occasion} · works with a small tweak`
      : `${occasion} · needs one more piece`;
}

export function describeWardrobeOutfit(items: WardrobeItem[], prefs: WardrobePreferences) {
  const score = scoreLook(items, prefs);
  return {
    description: buildDescription(items, prefs),
    why: buildWhy(items, prefs),
    suitability: buildSuitability(score, prefs.occasion),
    tips: buildTips(items, prefs),
    score,
  };
}

function buildTips(items: WardrobeItem[], prefs: WardrobePreferences): string {
  const shoes = items.find((item) => slotOf(item.category) === "shoes");
  const layer = items.find((item) => slotOf(item.category) === "layer");
  const accessory = items.find((item) => slotOf(item.category) === "accessory");
  const tips: string[] = [];

  if (prefs.occasion === "Office" || prefs.occasion === "Interview") {
    tips.push("Tuck the top and keep the hem clean — neatness reads as intent in a formal room.");
  } else if (prefs.occasion === "Wedding" || prefs.occasion === "Party") {
    tips.push("Let one piece carry the shine and keep everything else matte.");
  } else if (prefs.occasion === "Travel") {
    tips.push("Choose the most comfortable of your shoes and keep layers easy to remove.");
  } else {
    tips.push("Half-tuck the front so the waistline shows and the proportions stay intentional.");
  }

  if (!layer && prefs.outfitType === "layered") {
    tips.push("A structured overshirt or jacket would finish this properly — see Missing pieces.");
  } else if (layer) {
    tips.push(`Keep the ${layer.name.toLowerCase()} open so the top's neckline stays visible.`);
  }

  if (shoes) tips.push(`Match your belt or bag to the ${shoes.color.toLowerCase()} shoes for a pulled-together finish.`);
  if (!accessory) tips.push("One accessory — a watch or a simple chain — is enough; don't add more.");
  else tips.push(`The ${accessory.name.toLowerCase()} is your only metal; keep the rest of the look quiet.`);

  return tips.slice(0, 3).join(" ");
}

function titleFor(occasion: string, style: string, index: number, items: WardrobeItem[]): string {
  const top = items.find((item) => slotOf(item.category) === "top");
  const bottom = items.find((item) => slotOf(item.category) === "bottom");
  const adjective =
    top && bottom && top.color === bottom.color
      ? "Tonal"
      : index === 0
        ? "Considered"
        : index === 1
          ? "Easy"
          : "Polished";
  const noun = TITLE_NOUNS[index % TITLE_NOUNS.length];
  return `${adjective} ${occasion} ${noun} · ${style}`;
}

export function generateWardrobeOutfits(
  wardrobe: WardrobeItem[],
  rawPrefs: WardrobePreferences,
  seed = 1,
): { outfits: GeneratedWardrobeOutfit[]; gaps: string[] } {
  const prefs = rawPrefs;
  const random = mulberry32(seed);
  const gaps: string[] = [];

  const eligible = wardrobe.filter((item) => audienceMatches(prefs.audience, item.audience));
  const pool = eligible.length >= 3 ? eligible : wardrobe;
  const tops = pool.filter((item) => slotOf(item.category) === "top");
  const bottoms = pool.filter((item) => slotOf(item.category) === "bottom");
  const shoes = pool.filter((item) => slotOf(item.category) === "shoes");
  const layers = pool.filter((item) => slotOf(item.category) === "layer");
  const accessories = pool.filter((item) => slotOf(item.category) === "accessory");

  if (!tops.length) gaps.push("No tops in this wardrobe yet — add a t-shirt or shirt to start.");
  if (!bottoms.length) gaps.push("No bottoms in this wardrobe yet — add jeans, trousers or shorts.");
  if (!shoes.length) gaps.push("No shoes in this wardrobe yet — add a pair to finish the look.");
  if (!layers.length) gaps.push("No jackets yet, so layered looks will stay simple.");
  if (!accessories.length) gaps.push("No accessories yet — a watch or belt would finish these looks.");
  if (
    ["Office", "Interview", "Wedding", "Party"].includes(prefs.occasion) &&
    shoes.length > 0 &&
    shoes.every((shoe) => shoe.style === "Casual" || shoe.style === "Streetwear")
  ) {
    gaps.push("Your only shoes are casual — a formal pair would sharpen this outfit.");
  }

  if (!tops.length || !bottoms.length) {
    return { outfits: [], gaps };
  }

  const wantsLayer = prefs.outfitType === "layered";
  const allowsLayer = prefs.outfitType !== "minimal";
  const allowsAccessory = prefs.outfitType !== "minimal";

  const candidates: GeneratedWardrobeOutfit[] = [];
  const topChoices = [...tops].sort((a, b) => scoreItem(b, prefs) - scoreItem(a, prefs)).slice(0, 8);
  const bottomChoices = [...bottoms].sort((a, b) => scoreItem(b, prefs) - scoreItem(a, prefs)).slice(0, 8);

  for (const top of topChoices) {
    for (const bottom of bottomChoices) {
      const used = new Set<string>([top.id, bottom.id]);
      const outfitItems: WardrobeItem[] = [top, bottom];

      const bestShoe = pickBest(shoes, prefs, used);
      if (bestShoe) {
        outfitItems.push(bestShoe);
        used.add(bestShoe.id);
      }

      if (allowsLayer) {
        const bestLayer = pickBest(layers, prefs, used);
        if (bestLayer && (wantsLayer || scoreItem(bestLayer, prefs) >= scoreItem(top, prefs))) {
          outfitItems.push(bestLayer);
          used.add(bestLayer.id);
        }
      }

      if (allowsAccessory) {
        const bestAccessory = pickBest(accessories, prefs, used);
        if (bestAccessory && prefs.outfitType !== "smart-casual") {
          outfitItems.push(bestAccessory);
          used.add(bestAccessory.id);
        }
      }

      const score = scoreLook(outfitItems, prefs);
      const jitter = (random() - 0.5) * 4;
      const outfitGaps = [...gaps];
      if (wantsLayer && !outfitItems.some((item) => slotOf(item.category) === "layer")) {
        outfitGaps.unshift("This is a layered brief, but you don't own a jacket yet.");
      }

      candidates.push({
        id: `preview_${top.id}_${bottom.id}_${outfitItems.length}`,
        title: titleFor(prefs.occasion, prefs.style, 0, outfitItems),
        description: buildDescription(outfitItems, prefs),
        occasion: prefs.occasion,
        style: prefs.style,
        season: prefs.season,
        items: outfitItems,
        itemIds: outfitItems.map((item) => item.id),
        total: outfitItems.reduce((sum, item) => sum + item.price, 0),
        why: buildWhy(outfitItems, prefs),
        suitability: buildSuitability(score, prefs.occasion),
        tips: buildTips(outfitItems, prefs),
        gaps: unique(outfitGaps),
        score: Math.round(clamp(score + jitter)),
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  const selected: GeneratedWardrobeOutfit[] = [];
  const usedTops = new Set<string>();
  const usedBottoms = new Set<string>();
  for (const candidate of candidates) {
    if (selected.length >= 3) break;
    const topId = candidate.items.find((item) => slotOf(item.category) === "top")?.id ?? "";
    const bottomId = candidate.items.find((item) => slotOf(item.category) === "bottom")?.id ?? "";
    const reusedPair = usedTops.has(topId) && usedBottoms.has(bottomId);
    if (reusedPair) continue;
    usedTops.add(topId);
    usedBottoms.add(bottomId);
    selected.push({
      ...candidate,
      title: titleFor(prefs.occasion, prefs.style, selected.length, candidate.items),
    });
  }

  return { outfits: selected, gaps: unique(gaps) };
}

export function swapOutfitItem(
  outfit: GeneratedWardrobeOutfit,
  itemId: string,
  wardrobe: WardrobeItem[],
  prefs: WardrobePreferences,
  excludeIds: string[] = [],
): { item?: WardrobeItem; error?: string } {
  const current = outfit.items.find((item) => item.id === itemId);
  if (!current) return { error: "That piece is not part of this look." };
  const slot = slotOf(current.category);
  const blocked = new Set([...outfit.itemIds, ...excludeIds]);
  const options = wardrobe
    .filter((item) => slotOf(item.category) === slot && !blocked.has(item.id))
    .sort((a, b) => scoreItem(b, prefs) - scoreItem(a, prefs));
  if (!options.length) {
    return { error: `You don't have another ${slotLabel(slot)} to swap in yet.` };
  }
  return { item: options[0] };
}

export function scoreWardrobeOutfit(items: WardrobeItem[], outfit: WardrobeOutfit): number {
  const prefs: WardrobePreferences = {
    occasion: outfit.occasion,
    style: outfit.style,
    color: "Any",
    season: outfit.season,
    audience: "Any",
    outfitType: "complete",
  };
  return scoreLook(items, prefs);
}

export function wardrobeStats(wardrobe: WardrobeItem[]) {
  const tops = wardrobe.filter((item) => slotOf(item.category) === "top").length;
  const bottoms = wardrobe.filter((item) => slotOf(item.category) === "bottom").length;
  const shoes = Math.max(1, wardrobe.filter((item) => slotOf(item.category) === "shoes").length);
  const layers = wardrobe.filter((item) => slotOf(item.category) === "layer").length;
  const value = wardrobe.reduce((sum, item) => sum + item.price, 0);
  const combinations = tops * bottoms * shoes + layers * tops * bottoms;
  return { tops, bottoms, shoes, layers, value, combinations };
}

/* -------------------------------------------------------------------------- */
/* Missing item finder                                                         */
/* -------------------------------------------------------------------------- */

function productAudience(product: Product): WardrobeAudience {
  return product.audience === "men" ? "Men" : product.audience === "women" ? "Women" : "Unisex";
}

function compatible(item: WardrobeItem, product: Product): boolean {
  if (!audienceMatches(productAudience(product), item.audience)) return false;
  if (!seasonMatches(item.season, product.seasons[0] ?? "All-season")) return false;
  if (item.color === product.colors[0] || item.color === product.colors[1]) return true;
  if (NEUTRALS.has(item.color) || product.colors.some((color) => NEUTRALS.has(color))) return true;
  return product.styles.some((style) => normalizeStyle(style) === item.style);
}

function combinationCountFor(slot: WardrobeSlot, product: Product, wardrobe: WardrobeItem[]): number {
  const matching = wardrobe.filter((item) => slotOf(item.category) !== slot && compatible(item, product));
  const tops = matching.filter((item) => slotOf(item.category) === "top").length;
  const bottoms = matching.filter((item) => slotOf(item.category) === "bottom").length;
  const shoes = matching.filter((item) => slotOf(item.category) === "shoes").length;

  if (product.category === "Dresses") return Math.max(0, shoes);
  if (slot === "top") return Math.max(1, bottoms) * Math.max(1, shoes);
  if (slot === "bottom") return Math.max(1, tops) * Math.max(1, shoes);
  if (slot === "shoes") return Math.max(1, tops) * Math.max(1, bottoms);
  if (slot === "layer") return Math.max(1, tops) * Math.max(1, bottoms);
  return Math.max(1, tops); // accessories add variations, not new base outfits
}

function isOwned(product: Product, wardrobe: WardrobeItem[]): boolean {
  const productSlotValue = productSlot(product);
  return wardrobe.some((item) => {
    if (slotOf(item.category) !== productSlotValue) return false;
    const sameName = item.name.trim().toLowerCase() === product.name.trim().toLowerCase();
    const sameColour = product.colors.some((color) => color === item.color);
    return sameName || sameColour;
  });
}

function suggestedColorFor(product: Product, wardrobe: WardrobeItem[]): string {
  const owned = new Set(wardrobe.map((item) => item.color));
  return product.colors.find((color) => !owned.has(color)) ?? product.colors[0] ?? "Neutral";
}

export function scoreMissingCandidate(product: Product, wardrobe: WardrobeItem[]): MissingItemRecommendation | null {
  if (product.stock <= 0) return null;
  if (isOwned(product, wardrobe)) return null;
  const slot = productSlot(product);

  const matchedItems = wardrobe
    .filter((item) => slotOf(item.category) !== slot && compatible(item, product))
    .sort((a, b) => scoreItem(b, { occasion: "Casual", style: normalizeStyle(product.styles[0] ?? "Casual"), color: "Any", season: "All-season", audience: "Any", outfitType: "complete" }) - scoreItem(a, { occasion: "Casual", style: normalizeStyle(product.styles[0] ?? "Casual"), color: "Any", season: "All-season", audience: "Any", outfitType: "complete" }))
    .slice(0, 4);

  const newCombinations = Math.min(40, combinationCountFor(slot, product, wardrobe));
  const slotIsEmpty = !wardrobe.some((item) => slotOf(item.category) === slot);
  const slotCoverage = {
    top: wardrobe.filter((item) => slotOf(item.category) === "top").length,
    bottom: wardrobe.filter((item) => slotOf(item.category) === "bottom").length,
    shoes: wardrobe.filter((item) => slotOf(item.category) === "shoes").length,
    layer: wardrobe.filter((item) => slotOf(item.category) === "layer").length,
    accessory: wardrobe.filter((item) => slotOf(item.category) === "accessory").length,
  };

  const coverageTarget = slot === "top" ? 4 : slot === "bottom" ? 3 : 2;
  let gapBonus = clamp(((coverageTarget - slotCoverage[slot]) / coverageTarget) * 10, 0, 10);
  if (slot === "bottom" && slotCoverage.top > slotCoverage.bottom) {
    gapBonus += Math.min(6, (slotCoverage.top - slotCoverage.bottom - 1) * 2);
  }

  const matchScore = clamp((matchedItems.length / 5) * 30, 0, 30);
  const comboWeight = slot === "accessory" ? 0.3 : slot === "layer" ? 0.75 : 1;
  const comboScore = clamp((newCombinations / 12) * 30 * comboWeight, 0, 30);
  const priceScore =
    product.price <= 999 ? 15 : product.price <= 1999 ? 12 : product.price <= 3499 ? 8 : 4;
  const occasionScore = clamp((Math.min(product.occasions.length, 5) / 5) * 15, 0, 15);
  const score = Math.round(clamp(matchScore + comboScore + priceScore + occasionScore + gapBonus));

  const example = wardrobe
    .filter((item) => slotOf(item.category) !== slot)
    .slice(0, 2)
    .map((item) => item.name);
  const exampleCombination = [...example, product.name];

  const reasonParts: string[] = [];
  if (slotIsEmpty) reasonParts.push(`You have no ${slotLabel(slot)} in this category yet.`);
  reasonParts.push(
    matchedItems.length
      ? `It pairs with ${matchedItems.length} piece${matchedItems.length === 1 ? "" : "s"} you already own and unlocks about ${newCombinations} new combination${newCombinations === 1 ? "" : "s"}.`
      : `It is a versatile starting piece that will anchor future outfits — about ${newCombinations} combinations.`,
  );
  const colour = suggestedColorFor(product, wardrobe);
  const colourIsNew = !wardrobe.some((item) => item.color === colour);
  reasonParts.push(
    `At ${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(product.price)} ${
      colourIsNew
        ? `it adds a ${colour.toLowerCase()} option you don't already have.`
        : `it is a different piece from anything in this slot, so it adds variety without duplicating an exact item.`
    }`,
  );

  return {
    product: {
      id: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      image: product.image,
      category: product.category,
      price: product.price,
      colors: product.colors,
      retailer: product.retailer,
      occasions: product.occasions,
    },
    suggestedColor: suggestedColorFor(product, wardrobe),
    slot,
    score,
    matchedItems: matchedItems.map((item) => ({
      id: item.id,
      name: item.name,
      image: item.image,
      category: item.category,
      color: item.color,
    })),
    newCombinations,
    exampleCombination,
    reason: reasonParts.join(" "),
    scoreBreakdown: [
      { label: "Matches your wardrobe", value: Math.round(matchScore), max: 30 },
      { label: "New combinations", value: Math.round(comboScore), max: 30 },
      { label: "Price efficiency", value: Math.round(priceScore), max: 15 },
      { label: "Occasion range", value: Math.round(occasionScore), max: 15 },
      ...(gapBonus ? [{ label: "Fills a real gap", value: Math.round(gapBonus), max: 10 }] : []),
    ],
  };
}

export function findMissingItems(
  wardrobe: WardrobeItem[],
  products: Product[],
  limit = 6,
): MissingItemRecommendation[] {
  const scored = products
    .map((product) => scoreMissingCandidate(product, wardrobe))
    .filter((item): item is MissingItemRecommendation => Boolean(item))
    .sort((a, b) => b.score - a.score);

  const picked: MissingItemRecommendation[] = [];
  const perSlot = new Map<WardrobeSlot, number>();
  const perColour = new Set<string>();

  for (const candidate of scored) {
    if (picked.length >= limit) break;
    const slotCount = perSlot.get(candidate.slot) ?? 0;
    if (slotCount >= 2) continue;
    const key = `${candidate.slot}:${candidate.suggestedColor}`;
    if (perColour.has(key)) continue;
    perSlot.set(candidate.slot, slotCount + 1);
    perColour.add(key);
    picked.push(candidate);
  }

  return picked;
}

/* -------------------------------------------------------------------------- */
/* Budget optimizer                                                            */
/* -------------------------------------------------------------------------- */

export function buildBudgetPlan(
  wardrobe: WardrobeItem[],
  products: Product[],
  budget: number,
): {
  budget: number;
  picks: (MissingItemRecommendation & { runningTotal: number })[];
  total: number;
  remaining: number;
  newCombinations: number;
  explanation: string;
} {
  const safeBudget = Math.round(Math.min(Math.max(budget, 100), 200000));
  const candidates = products
    .filter((product) => product.price <= safeBudget && product.stock > 0)
    .map((product) => scoreMissingCandidate(product, wardrobe))
    .filter((item): item is MissingItemRecommendation => Boolean(item));

  // Prefer pieces that create real new outfits over cheap accessories: a cap
  // adds variations, while a bottom or pair of shoes unlocks complete looks.
  const impact = (item: MissingItemRecommendation) => {
    const weight = item.slot === "accessory" ? 0.35 : item.slot === "layer" ? 0.8 : 1;
    return (item.newCombinations * 6 + item.score) * weight;
  };

  candidates.sort((a, b) => impact(b) - impact(a));

  const picks: (MissingItemRecommendation & { runningTotal: number })[] = [];
  const usedCategories = new Map<string, number>();
  const usedColourSlots = new Set<string>();
  let total = 0;

  for (const candidate of candidates) {
    if (picks.length >= 5) break;
    if (total + candidate.product.price > safeBudget) continue;
    if ((usedCategories.get(candidate.product.category) ?? 0) >= 2) continue;
    const key = `${candidate.slot}:${candidate.suggestedColor}`;
    if (usedColourSlots.has(key) && picks.length >= 2) continue;
    total += candidate.product.price;
    usedCategories.set(candidate.product.category, (usedCategories.get(candidate.product.category) ?? 0) + 1);
    usedColourSlots.add(key);
    picks.push({ ...candidate, runningTotal: total });
  }

  const newCombinations = picks.reduce((sum, item) => sum + item.newCombinations, 0);
  const remaining = safeBudget - total;
  const explanation = picks.length
    ? `This plan adds ${picks.length} versatile piece${picks.length === 1 ? "" : "s"} for ${new Intl.NumberFormat(
        "en-IN",
        { style: "currency", currency: "INR", maximumFractionDigits: 0 },
      ).format(total)} and leaves ${new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(remaining)}. Together they unlock roughly ${newCombinations} additional combinations with what you already own.`
    : `Nothing in the catalogue fits ₹${safeBudget.toLocaleString("en-IN")} alongside your wardrobe. Try a slightly higher budget.`;

  return { budget: safeBudget, picks, total, remaining, newCombinations, explanation };
}

/* -------------------------------------------------------------------------- */
/* Wardrobe assistant (rule based, optional Gemini handled in the route)       */
/* -------------------------------------------------------------------------- */

function findMentionedItem(message: string, wardrobe: WardrobeItem[]): WardrobeItem | undefined {
  const text = message.toLowerCase();
  const named = wardrobe.find((item) => {
    const name = item.name.toLowerCase();
    return text.includes(name) || (text.includes(item.color.toLowerCase()) && text.includes(item.category.toLowerCase().replace(/s$/, "")));
  });
  if (named) return named;
  // Fall back to the first piece of a category the user names, so “style this
  // shirt” still refers to something they actually own.
  const category = WARDROBE_CATEGORIES.find((entry) =>
    text.includes(entry.toLowerCase().replace(/s$/, "")),
  );
  return category ? wardrobe.find((item) => item.category === category) : undefined;
}

export function answerWardrobeAssistant(
  message: string,
  wardrobe: WardrobeItem[],
  products: Product[],
): WardrobeAssistantReply {
  const text = message.toLowerCase();
  const stats = wardrobeStats(wardrobe);

  if (!wardrobe.length) {
    return {
      message:
        "Your closet is empty, so I can only give generic advice right now. Add a few pieces — a top, a bottom and shoes is enough — and I can build outfits from what you actually own, then show you what's missing.",
      productIds: [],
      wardrobeItemIds: [],
      action: "advice",
      source: "rule",
    };
  }

  const budgetMatch = text.match(/(?:under|below|budget|upto|up to|around)\s*(?:₹|rs\.?|inr)?\s*([\d,]+)/);
  if (budgetMatch || text.includes("what should i buy") || text.includes("what to buy")) {
    const budget = budgetMatch ? Number(budgetMatch[1].replace(/,/g, "")) : 2000;
    const plan = buildBudgetPlan(wardrobe, products, budget);
    return {
      message: plan.explanation,
      productIds: plan.picks.map((pick) => pick.product.id),
      wardrobeItemIds: [],
      action: "budget",
      source: "rule",
    };
  }

  if (text.includes("missing") || text.includes("gap") || text.includes("need")) {
    const missing = findMissingItems(wardrobe, products, 3);
    return {
      message: missing.length
        ? `The biggest gaps are ${missing
            .map((item) => `${item.product.name} (${slotLabel(item.slot)})`)
            .join(", ")}. ${missing[0].reason}`
        : "Your wardrobe already covers tops, bottoms and shoes, so there is no obvious gap. Add colour or a layer if you want more variety.",
      productIds: missing.map((item) => item.product.id),
      wardrobeItemIds: [],
      action: "missing",
      source: "rule",
    };
  }

  const matches = text.match(/match|goes with|wear with|pair with|style (my|this)/);
  const mentioned = findMentionedItem(message, wardrobe);
  if (matches && mentioned) {
    const partners = wardrobe
      .filter((item) => item.id !== mentioned.id && slotOf(item.category) !== slotOf(mentioned.category))
      .filter((item) => colorsWork(item.color, mentioned.color) || item.style === mentioned.style)
      .slice(0, 4);
    return {
      message: partners.length
        ? `Your ${mentioned.name.toLowerCase()} goes with ${partners
            .map((item) => `the ${item.name.toLowerCase()}`)
            .join(", ")}. Keep the palette to ${mentioned.color.toLowerCase()} plus neutrals, and let the shoes decide how formal it reads.`
        : `The ${mentioned.name.toLowerCase()} is a statement on its own — you don't own an obvious partner yet. A neutral bottom would open it up; check Missing pieces for options.`,
      productIds: [],
      wardrobeItemIds: [mentioned.id, ...partners.map((item) => item.id)],
      action: "match",
      source: "rule",
    };
  }

  const occasion = WARDROBE_OCCASIONS.find((entry) => text.includes(entry.toLowerCase()));
  const style = WARDROBE_STYLES.find((entry) => text.includes(entry.toLowerCase()));
  const season = WARDROBE_SEASONS.find((entry) => text.includes(entry.toLowerCase()));
  const countMatch = text.match(/(\d+)\s*(?:outfit|look)/);
  const wantsOutfit =
    Boolean(occasion) ||
    text.includes("outfit") ||
    text.includes("wear") ||
    text.includes("look") ||
    Boolean(countMatch);

  if (wantsOutfit) {
    const occasionStyle = occasion ? (OCCASION_STYLES[occasion]?.[0] ?? "Minimal") : "Minimal";
    const prefs: WardrobePreferences = {
      occasion: occasion ?? "Casual",
      style: style ?? occasionStyle,
      color: "Any",
      season: season ?? "All-season",
      audience: "Any",
      outfitType: "complete",
    };
    const { outfits, gaps } = generateWardrobeOutfits(wardrobe, prefs, Date.now());
    if (!outfits.length) {
      return {
        message: `I can't build a full look yet: ${gaps[0]} Add that piece and ask me again.`,
        productIds: [],
        wardrobeItemIds: [],
        action: "outfits",
        source: "rule",
      };
    }
    const wanted = countMatch ? Math.min(Math.max(Number(countMatch[1]), 1), outfits.length) : 1;
    return {
      message:
        wanted > 1
          ? `Here are ${wanted} looks from your wardrobe for ${prefs.occasion.toLowerCase()}. ${outfits[0].why}`
          : outfits[0].why,
      outfit: wanted > 1 ? undefined : outfits[0],
      outfits: wanted > 1 ? outfits.slice(0, wanted) : undefined,
      productIds: [],
      wardrobeItemIds: outfits.slice(0, wanted).flatMap((outfit) => outfit.itemIds),
      action: "outfits",
      source: "rule",
    };
  }

  const mentionedCategory = WARDROBE_CATEGORIES.find((entry) => text.includes(entry.toLowerCase().replace(/s$/, "")));
  if (mentionedCategory) {
    const items = wardrobe.filter((item) => item.category === mentionedCategory).slice(0, 4);
    return {
      message: items.length
        ? `You own ${items.length} ${mentionedCategory.toLowerCase()}: ${items.map((item) => item.name.toLowerCase()).join(", ")}. Ask me to build a casual or office look and I'll combine them properly.`
        : `No ${mentionedCategory.toLowerCase()} in your closet yet. The Missing pieces tab is the quickest way to fill that gap.`,
      productIds: [],
      wardrobeItemIds: items.map((item) => item.id),
      action: "advice",
      source: "rule",
    };
  }

  return {
    message: `You have ${wardrobe.length} pieces worth about ₹${stats.value.toLocaleString("en-IN")}, with roughly ${stats.combinations} base combinations. Ask me what to wear to an occasion, what matches a specific piece, what's missing, or what to buy under a budget.`,
    productIds: [],
    wardrobeItemIds: [],
    action: "advice",
    source: "rule",
  };
}
