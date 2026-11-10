import type { Product, StylistPreferences } from "./types";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

async function callGemini(options: {
  system: string;
  user: string;
  temperature?: number;
  timeoutMs?: number;
}): Promise<unknown | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        MODEL,
      )}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: options.system }] },
          contents: [{ role: "user", parts: [{ text: options.user }] }],
          generationConfig: {
            temperature: options.temperature ?? 0.85,
            responseMimeType: "application/json",
            maxOutputTokens: 2048,
          },
        }),
        signal: AbortSignal.timeout(options.timeoutMs ?? 15000),
        cache: "no-store",
      },
    );
    if (!response.ok) return null;
    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function catalogForPrompt(products: Product[], budget: number): string {
  return products
    .filter((p) => p.price <= budget && p.stock > 0)
    .slice(0, 70)
    .map(
      (p) =>
        `${p.id} | ${p.name} | ${p.brand} | ${p.category} | ${p.audience} | ₹${p.price} | colors: ${p.colors.join(
          "/",
        )} | styles: ${p.styles.join("/")} | fit: ${p.fit} | occasions: ${p.occasions.join("/")}`,
    )
    .join("\n");
}

export async function generateStylistWithGemini(
  prefs: StylistPreferences,
  products: Product[],
): Promise<{ outfits: unknown; summary?: string } | null> {
  const system = [
    "You are WearWise AI, a premium Indian fashion stylist.",
    "You must style outfits using ONLY products from the provided catalogue, referenced by their exact id.",
    "Never invent products, prices, brands or ids. Never exceed the user's total budget.",
    "Prefer a complete look: one top, one bottom, one pair of shoes, plus an optional layer or accessory.",
    "For ethnic or wedding requests with women, a single dress or saree plus shoes and an accessory is a complete look.",
    "Explain in plain, confident English why each piece suits the user's occasion, style, colours and body fit.",
    "Return JSON exactly in this shape:",
    '{"outfits":[{"title":"short editorial title","items":["p001","p011","p034"],"rationale":"2-3 sentences referencing the actual products and the user preferences","stylingTip":"one actionable styling tip"}],"summary":"one sentence overview"}',
    "Give exactly 3 outfits that are meaningfully different from each other.",
  ].join(" ");

  const user = [
    `User preferences: audience=${prefs.audience}; total outfit budget=₹${prefs.budget}; occasion=${prefs.occasion}; style=${prefs.style}; preferred colours=${
      prefs.colors.join(", ") || "any"
    }; season=${prefs.season}; preferred categories=${prefs.categories.join(", ") || "any"}; fit=${
      prefs.fit || "any"
    }; extra notes=${prefs.instructions || "none"}.`,
    "Catalogue (id | name | brand | category | audience | price | colors | styles | fit | occasions):",
    catalogForPrompt(products, prefs.budget),
    "Return only valid JSON.",
  ].join("\n");

  const result = (await callGemini({ system, user })) as
    | { outfits?: unknown; summary?: string }
    | null;
  if (!result || !result.outfits) return null;
  return { outfits: result.outfits, summary: result.summary };
}

export async function chatWithGemini(
  message: string,
  products: Product[],
  history: { role: "user" | "assistant"; content: string }[],
): Promise<{ message: string; productIds: string[] } | null> {
  const system = [
    "You are WearWise AI, a warm, concise personal fashion stylist for an Indian audience.",
    "Recommend ONLY products from the catalogue, using their exact ids in productIds.",
    "Keep answers under 130 words, practical, and specific about fit, colour and budget.",
    "If the question is not about fashion or styling, politely redirect to styling.",
    "Return JSON exactly: {\"message\":\"your reply\",\"productIds\":[\"p001\",\"p002\"]}",
    "Use 0-4 productIds. Never invent ids or prices.",
  ].join(" ");

  const context = products
    .slice(0, 70)
    .map((p) => `${p.id} | ${p.name} | ${p.brand} | ${p.category} | ₹${p.price} | ${p.colors.join("/")} | ${p.styles.join("/")}`)
    .join("\n");

  const conversation = history
    .slice(-6)
    .map((h) => `${h.role === "user" ? "Customer" : "Stylist"}: ${h.content}`)
    .join("\n");

  const user = `Catalogue:\n${context}\n\nConversation so far:\n${conversation || "(new conversation)"}\n\nCustomer: ${message}\nReturn only JSON.`;

  const result = (await callGemini({ system, user, temperature: 0.7 })) as
    | { message?: string; productIds?: unknown }
    | null;
  if (!result || typeof result.message !== "string") return null;
  const validIds = new Set(products.map((p) => p.id));
  const ids = Array.isArray(result.productIds)
    ? result.productIds.map(String).filter((id) => validIds.has(id)).slice(0, 4)
    : [];
  return { message: result.message, productIds: ids };
}

export async function parseSearchWithGemini(query: string): Promise<Record<string, unknown> | null> {
  const system = [
    "You convert natural-language fashion search queries into filters for an Indian e-commerce catalogue.",
    "Valid categories: T-Shirts, Shirts, Jeans, Trousers, Hoodies, Jackets, Dresses, Shoes, Accessories, Ethnic Wear.",
    "Valid colours: Black, White, Cream, Beige, Grey, Navy, Blue, Indigo, Olive, Wine, Tan, Red, Green, Pink, Orange.",
    "Valid styles: Streetwear, Minimalist, Old Money, Casual, Formal, Sporty, Traditional, Aesthetic.",
    "Valid audiences: men, women, unisex.",
    "Return JSON exactly: {\"colors\":[],\"categories\":[],\"styles\":[],\"audience\":null,\"maxPrice\":null,\"minPrice\":null,\"keywords\":\"\"}",
    "Use null or empty arrays when the query does not specify something. Prices are in INR.",
  ].join(" ");
  const result = (await callGemini({
    system,
    user: query,
    temperature: 0,
    timeoutMs: 5000,
  })) as Record<string, unknown> | null;
  return result;
}
