export const CLOSET_TABS = [
  { key: "wardrobe", label: "My wardrobe" },
  { key: "generate", label: "AI outfits" },
  { key: "missing", label: "Missing pieces" },
  { key: "budget", label: "Budget optimizer" },
  { key: "assistant", label: "Style assistant" },
  { key: "plans", label: "Saved & planned" },
] as const;

export type ClosetTab = (typeof CLOSET_TABS)[number]["key"];

export function isClosetTab(value: string | undefined): value is ClosetTab {
  return CLOSET_TABS.some((entry) => entry.key === value);
}
