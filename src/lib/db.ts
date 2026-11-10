import fs from "node:fs";
import path from "node:path";
import type { Database, Product, User, WardrobeItem, WardrobeOutfit } from "./types";
import { PRODUCTS, CATEGORIES, BRANDS, SEED_ADMIN, SEED_CUSTOMER, SEED_WARDROBE } from "./seed";
import { hashPassword, randomId } from "./crypto";

const DATA_DIR = process.env.WEARWISE_DATA_DIR || path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "store.json");

// Bump when products are appended to the seed so existing local stores pick
// them up without losing admin edits or user data.
const SEED_VERSION = 3;

type Cache = { db: Database | null; mtimeMs: number };
const globalCache = globalThis as unknown as { __wearwiseDbCache?: Cache };
if (!globalCache.__wearwiseDbCache) globalCache.__wearwiseDbCache = { db: null, mtimeMs: 0 };

function emptyPreferences() {
  return {
    audience: "" as const,
    budget: "",
    occasion: "",
    style: "",
    colors: [] as string[],
    season: "",
    fit: "" as const,
  };
}

function seedUsers(): User[] {
  const now = new Date().toISOString();
  return [
    {
      id: "u_admin",
      name: SEED_ADMIN.name,
      email: SEED_ADMIN.email,
      passwordHash: hashPassword(SEED_ADMIN.password),
      role: "admin",
      createdAt: now,
      preferences: { ...emptyPreferences(), audience: "men", budget: "2000-5000", occasion: "Office", style: "Old Money", fit: "regular" },
    },
    {
      id: "u_demo",
      name: SEED_CUSTOMER.name,
      email: SEED_CUSTOMER.email,
      passwordHash: hashPassword(SEED_CUSTOMER.password),
      role: "user",
      createdAt: now,
      preferences: { ...emptyPreferences(), audience: "women", budget: "2000-5000", occasion: "Date", style: "Aesthetic", colors: ["Cream", "Black"], season: "Summer", fit: "regular" },
    },
  ];
}

function seedWardrobe(): WardrobeItem[] {
  const now = new Date().toISOString();
  return SEED_WARDROBE.map((item, index) => ({
    ...item,
    id: `w${String(index + 1).padStart(3, "0")}`,
    userId: "u_demo",
    createdAt: now,
  }));
}

function seedDemoCloset(items: WardrobeItem[]): {
  collection: Database["wardrobeCollections"][number];
  outfit: WardrobeOutfit;
} {
  const ids = ["w001", "w003", "w008", "w009"];
  const byId = new Map(items.map((item) => [item.id, item]));
  const total = ids.reduce((sum, id) => sum + (byId.get(id)?.price ?? 0), 0);
  return {
    collection: {
      id: "wcol_demo",
      userId: "u_demo",
      name: "Everyday rotation",
      description: "The looks I actually repeat.",
      createdAt: new Date().toISOString(),
    },
    outfit: {
      id: "wlook_demo",
      userId: "u_demo",
      title: "Everyday monochrome · Minimal",
      description: "Clean white tee and black denim, grounded by white sneakers and one warm accessory.",
      itemIds: ids,
      occasion: "College",
      style: "Minimal",
      season: "All-season",
      total,
      why: "White against black is the sharpest neutral pairing you own, and the leather watch adds warmth without breaking the palette.",
      suitability: "College · strong match",
      tips: "Half-tuck the tee and keep the watch as the only accessory.",
      favorite: true,
      collectionId: "wcol_demo",
      createdAt: new Date().toISOString(),
    },
  };
}

function createSeedDb(): Database {
  const wardrobe = seedWardrobe();
  const demoCloset = seedDemoCloset(wardrobe);
  return {
    version: 1,
    seedVersion: SEED_VERSION,
    users: seedUsers(),
    products: PRODUCTS,
    categories: CATEGORIES,
    brands: BRANDS,
    outfits: [],
    aiHistory: [],
    clicks: [],
    contacts: [],
    newsletter: [],
    passwordResets: [],
    wardrobe,
    wardrobeOutfits: [demoCloset.outfit],
    wardrobeCollections: [demoCloset.collection],
    wardrobePlanner: [],
  };
}

function migrate(db: Database): Database {
  const previousSeedVersion = db.seedVersion ?? 0;
  db.seedVersion = SEED_VERSION;
  // Keep the catalogue in sync with newly seeded products while preserving
  // any admin edits (matched by id).
  const byId = new Map(db.products.map((p) => [p.id, p]));
  for (const seedProduct of PRODUCTS) {
    if (!byId.has(seedProduct.id)) db.products.push(seedProduct);
  }
  if (!db.categories?.length) db.categories = CATEGORIES;
  if (!db.brands?.length) db.brands = BRANDS;
  if (!db.passwordResets) db.passwordResets = [];

  if (!Array.isArray(db.wardrobe)) db.wardrobe = [];
  if (!Array.isArray(db.wardrobeOutfits)) db.wardrobeOutfits = [];
  if (!Array.isArray(db.wardrobeCollections)) db.wardrobeCollections = [];
  if (!Array.isArray(db.wardrobePlanner)) db.wardrobePlanner = [];

  // One-time starter closet for the demo account when upgrading an existing
  // store. New stores already include it via createSeedDb.
  if (previousSeedVersion < 3 && db.wardrobe.length === 0) {
    const wardrobe = seedWardrobe();
    const demoCloset = seedDemoCloset(wardrobe);
    db.wardrobe = wardrobe;
    db.wardrobeOutfits = [demoCloset.outfit];
    db.wardrobeCollections = [demoCloset.collection];
  }

  return db;
}

function persist(db: Database) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf8");
  fs.renameSync(tmp, DB_FILE);
  const stat = fs.statSync(DB_FILE);
  const cache = globalCache.__wearwiseDbCache!;
  cache.db = db;
  cache.mtimeMs = stat.mtimeMs;
}

/**
 * Guarantees newer collections exist on data cached by a process that was
 * started before they were introduced (e.g. during a hot reload).
 */
function ensureShape(db: Database): Database {
  if (!Array.isArray(db.users)) db.users = [];
  if (!Array.isArray(db.products)) db.products = [];
  if (!Array.isArray(db.outfits)) db.outfits = [];
  if (!Array.isArray(db.aiHistory)) db.aiHistory = [];
  if (!Array.isArray(db.clicks)) db.clicks = [];
  if (!Array.isArray(db.contacts)) db.contacts = [];
  if (!Array.isArray(db.newsletter)) db.newsletter = [];
  if (!Array.isArray(db.passwordResets)) db.passwordResets = [];
  if (!Array.isArray(db.wardrobe)) db.wardrobe = [];
  if (!Array.isArray(db.wardrobeOutfits)) db.wardrobeOutfits = [];
  if (!Array.isArray(db.wardrobeCollections)) db.wardrobeCollections = [];
  if (!Array.isArray(db.wardrobePlanner)) db.wardrobePlanner = [];
  return db;
}

export function getDb(): Database {
  const cache = globalCache.__wearwiseDbCache!;
  if (fs.existsSync(DB_FILE)) {
    const stat = fs.statSync(DB_FILE);
    if (cache.db && cache.mtimeMs === stat.mtimeMs) return ensureShape(cache.db);
    try {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, "utf8")) as Database;
      const needsSeedSync = parsed.seedVersion !== SEED_VERSION;
      const migrated = ensureShape(migrate(parsed));
      if (needsSeedSync) {
        persist(migrated);
      } else {
        cache.db = migrated;
        cache.mtimeMs = stat.mtimeMs;
      }
      return migrated;
    } catch {
      // fall through to reseed on a corrupt file
    }
  }
  const fresh = createSeedDb();
  persist(fresh);
  return fresh;
}

export function mutateDb<T>(fn: (db: Database) => T): T {
  const db = getDb();
  const result = fn(db);
  persist(db);
  return result;
}

export function resetDb(): Database {
  const fresh = createSeedDb();
  persist(fresh);
  return fresh;
}

export function findUserByEmail(email: string): User | undefined {
  const normalized = email.trim().toLowerCase();
  return getDb().users.find((u) => u.email.toLowerCase() === normalized);
}

export function findUserById(id: string): User | undefined {
  return getDb().users.find((u) => u.id === id);
}

export function getProducts(): Product[] {
  return getDb().products;
}

export function getProductBySlug(slug: string): Product | undefined {
  return getDb().products.find((p) => p.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return getDb().products.find((p) => p.id === id);
}

export function getWardrobeForUser(userId: string): WardrobeItem[] {
  return (getDb().wardrobe ?? []).filter((item) => item.userId === userId);
}

export function getWardrobeOutfitsForUser(userId: string): WardrobeOutfit[] {
  return (getDb().wardrobeOutfits ?? []).filter((outfit) => outfit.userId === userId);
}

export function getWardrobeCollectionsForUser(userId: string): Database["wardrobeCollections"] {
  return (getDb().wardrobeCollections ?? []).filter((collection) => collection.userId === userId);
}

export function getWardrobePlannerForUser(userId: string): Database["wardrobePlanner"] {
  return (getDb().wardrobePlanner ?? []).filter((entry) => entry.userId === userId);
}

export function addHistory(entry: {
  userId: string;
  kind: "stylist" | "chat" | "search";
  prompt: string;
  source: "gemini" | "fallback";
}) {
  mutateDb((db) => {
    db.aiHistory.unshift({ id: randomId("ai"), createdAt: new Date().toISOString(), ...entry });
    if (db.aiHistory.length > 500) db.aiHistory.length = 500;
  });
}
