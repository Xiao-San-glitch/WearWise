export type Audience = "men" | "women" | "unisex";
export type Fit = "slim" | "regular" | "oversized";

export type WardrobeCategory =
  | "Tops"
  | "Shirts"
  | "T-shirts"
  | "Pants"
  | "Jeans"
  | "Shorts"
  | "Jackets"
  | "Shoes"
  | "Accessories"
  | "Ethnic wear";

export type WardrobeSlot = "top" | "bottom" | "layer" | "shoes" | "accessory";

export type WardrobeAudience = "Men" | "Women" | "Unisex";

export interface WardrobeItem {
  id: string;
  userId: string;
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
  notes?: string;
  createdAt: string;
}

export interface WardrobeOutfit {
  id: string;
  userId: string;
  title: string;
  description: string;
  itemIds: string[];
  occasion: string;
  style: string;
  season: string;
  total: number;
  why: string;
  suitability: string;
  tips: string;
  favorite: boolean;
  collectionId: string | null;
  createdAt: string;
}

export interface WardrobeCollection {
  id: string;
  userId: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface PlannerEntry {
  id: string;
  userId: string;
  date: string;
  outfitId: string;
  note: string;
  createdAt: string;
}

export interface WardrobeOutfitView extends WardrobeOutfit {
  items: WardrobeItem[];
  gaps: string[];
  score: number;
}

export interface WardrobePreferences {
  occasion: string;
  style: string;
  color: string;
  season: string;
  audience: WardrobeAudience | "Any";
  outfitType: "complete" | "smart-casual" | "layered" | "minimal";
}

export interface GeneratedWardrobeOutfit {
  id: string;
  title: string;
  description: string;
  occasion: string;
  style: string;
  season: string;
  items: WardrobeItem[];
  itemIds: string[];
  total: number;
  why: string;
  suitability: string;
  tips: string;
  gaps: string[];
  score: number;
}

export interface WardrobeAssistantReply {
  message: string;
  outfit?: GeneratedWardrobeOutfit;
  outfits?: GeneratedWardrobeOutfit[];
  productIds: string[];
  wardrobeItemIds: string[];
  action: "outfits" | "budget" | "missing" | "match" | "advice";
  source: "gemini" | "rule";
}

export interface MissingItemRecommendation {
  product: {
    id: string;
    slug: string;
    name: string;
    brand: string;
    image: string;
    category: string;
    price: number;
    colors: string[];
    retailer: string;
    occasions: string[];
  };
  suggestedColor: string;
  slot: WardrobeSlot;
  score: number;
  matchedItems: { id: string; name: string; image: string; category: string; color: string }[];
  newCombinations: number;
  exampleCombination: string[];
  reason: string;
  scoreBreakdown: { label: string; value: number; max: number }[];
}

export interface BudgetPlanItem extends MissingItemRecommendation {
  runningTotal: number;
}

export interface BudgetPlan {
  budget: number;
  picks: BudgetPlanItem[];
  total: number;
  remaining: number;
  newCombinations: number;
  explanation: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  mrp: number;
  category: string;
  audience: Audience;
  colors: string[];
  styles: string[];
  occasions: string[];
  seasons: string[];
  fit: Fit;
  sizes: string[];
  image: string;
  gallery: string[];
  description: string;
  specs: { label: string; value: string }[];
  retailer: string;
  affiliateUrl: string;
  sponsored: boolean;
  rating: number;
  reviews: number;
  stock: number;
  createdAt: string;
  popularity: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "user" | "admin";
  createdAt: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  audience: Audience | "";
  budget: string;
  occasion: string;
  style: string;
  colors: string[];
  season: string;
  fit: Fit | "";
}

export interface SavedOutfit {
  id: string;
  userId: string;
  title: string;
  productIds: string[];
  total: number;
  explanation: string;
  preferences: Record<string, unknown>;
  createdAt: string;
}

export interface AiHistoryEntry {
  id: string;
  userId: string;
  kind: "stylist" | "chat" | "search";
  prompt: string;
  source: "gemini" | "fallback";
  createdAt: string;
}

export interface AffiliateClick {
  id: string;
  productId: string;
  productName: string;
  userEmail: string | null;
  source: string;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}

export interface NewsletterSignup {
  id: string;
  email: string;
  createdAt: string;
}

export interface Category {
  name: string;
  slug: string;
  image: string;
  blurb: string;
}

export interface PasswordReset {
  token: string;
  email: string;
  expiresAt: string;
}

export interface Database {
  version: number;
  seedVersion?: number;
  users: User[];
  products: Product[];
  categories: Category[];
  brands: string[];
  outfits: SavedOutfit[];
  aiHistory: AiHistoryEntry[];
  clicks: AffiliateClick[];
  contacts: ContactMessage[];
  newsletter: NewsletterSignup[];
  passwordResets: PasswordReset[];
  wardrobe: WardrobeItem[];
  wardrobeOutfits: WardrobeOutfit[];
  wardrobeCollections: WardrobeCollection[];
  wardrobePlanner: PlannerEntry[];
}

export interface StylistPreferences {
  audience: Audience;
  budget: number;
  budgetLabel: string;
  occasion: string;
  style: string;
  colors: string[];
  season: string;
  categories: string[];
  fit: Fit | "";
  instructions: string;
}

export interface OutfitItemView {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  mrp: number;
  color: string;
  category: string;
  image: string;
  retailer: string;
  sizes: string[];
  affiliateUrl: string;
  styles: string[];
}

export interface OutfitRecommendation {
  id: string;
  title: string;
  rationale: string;
  stylingTip: string;
  items: OutfitItemView[];
  total: number;
}

export interface StylistResponse {
  outfits: OutfitRecommendation[];
  source: "gemini" | "fallback";
  summary: string;
  budget: number;
  remaining: number;
}
