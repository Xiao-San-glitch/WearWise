"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Shirt, Sparkles, Wallet, CalendarDays, ScanSearch } from "lucide-react";
import type {
  PlannerEntry,
  WardrobeCollection,
  WardrobeItem,
  WardrobeOutfitView,
} from "@/lib/types";
import { useStore } from "../store-provider";
import { ClosetAssistant } from "./closet-assistant";
import { BudgetOptimizer } from "./budget-optimizer";
import { MissingItemFinder } from "./missing-item-finder";
import { OutfitLibrary } from "./outfit-library";
import { OutfitStudio } from "./outfit-studio";
import { WardrobeManager } from "./wardrobe-manager";
import { CLOSET_TABS, type ClosetTab } from "@/lib/closet";

const TAB_ICONS = {
  wardrobe: Shirt,
  generate: Sparkles,
  missing: ScanSearch,
  budget: Wallet,
  assistant: Sparkles,
  plans: CalendarDays,
} as const;

export function ClosetShell({
  initialItems,
  initialOutfits,
  initialCollections,
  initialPlanner,
  initialTab = "wardrobe",
}: {
  initialItems: WardrobeItem[];
  initialOutfits: WardrobeOutfitView[];
  initialCollections: WardrobeCollection[];
  initialPlanner: PlannerEntry[];
  initialTab?: ClosetTab;
}) {
  const { notify } = useStore();
  const router = useRouter();
  const [tab, setTab] = useState<ClosetTab>(initialTab);
  const [items, setItems] = useState(initialItems);
  const [outfits, setOutfits] = useState(initialOutfits);
  const [collections, setCollections] = useState(initialCollections);
  const [planner, setPlanner] = useState(initialPlanner);

  const refreshItems = useCallback(async () => {
    const response = await fetch("/api/wardrobe");
    if (!response.ok) return;
    const data = (await response.json()) as { items?: WardrobeItem[] };
    if (data.items) setItems(data.items);
    router.refresh();
  }, [router]);

  const refreshOutfits = useCallback(async () => {
    const response = await fetch("/api/wardrobe/outfits");
    if (!response.ok) return;
    const data = (await response.json()) as { outfits?: WardrobeOutfitView[] };
    if (data.outfits) setOutfits(data.outfits);
    router.refresh();
  }, [router]);

  const refreshEverything = useCallback(async () => {
    await Promise.all([
      refreshItems(),
      refreshOutfits(),
      fetch("/api/wardrobe/collections")
        .then((response) => (response.ok ? response.json() : null))
        .then((data: { collections?: WardrobeCollection[] } | null) => {
          if (data?.collections) setCollections(data.collections);
        }),
      fetch("/api/wardrobe/planner")
        .then((response) => (response.ok ? response.json() : null))
        .then((data: { entries?: PlannerEntry[] } | null) => {
          if (data?.entries) setPlanner(data.entries);
        }),
    ]);
  }, [refreshItems, refreshOutfits]);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState(null, "", url.toString());
  }, [tab]);

  const counts: Record<ClosetTab, number | null> = {
    wardrobe: items.length,
    generate: null,
    missing: null,
    budget: null,
    assistant: null,
    plans: outfits.length,
  };

  return (
    <div>
      <div className="sticky top-[72px] z-30 border-b border-ink/10 bg-paper/95 backdrop-blur-md">
        <div className="container-ww">
          <nav
            className="no-scrollbar -mx-1 flex items-center gap-1 overflow-x-auto py-2"
            aria-label="Smart Closet sections"
          >
            {CLOSET_TABS.map((entry) => {
              const Icon = TAB_ICONS[entry.key];
              const active = tab === entry.key;
              const count = counts[entry.key];
              return (
                <button
                  key={entry.key}
                  onClick={() => setTab(entry.key)}
                  aria-current={active ? "page" : undefined}
                  className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-[10px] uppercase tracking-[0.1em] transition-colors sm:px-4 ${
                    active ? "bg-ink text-cream" : "text-graphite hover:bg-cream"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {entry.label}
                  {count !== null && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[9px] tabular ${
                        active ? "bg-cream/20" : "bg-ink/5 text-smoke"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="container-ww py-8 sm:py-10">
        {tab === "wardrobe" && (
          <WardrobeManager items={items} onChanged={refreshItems} notify={notify} />
        )}

        {tab === "generate" && (
          <OutfitStudio
            items={items}
            onSaved={refreshOutfits}
            notify={notify}
            onAddPieces={() => setTab("wardrobe")}
          />
        )}

        {tab === "missing" && (
          <MissingItemFinder items={items} onAddPieces={() => setTab("wardrobe")} />
        )}

        {tab === "budget" && (
          <BudgetOptimizer items={items} onAddPieces={() => setTab("wardrobe")} />
        )}

        {tab === "assistant" && (
          <ClosetAssistant items={items} onAddPieces={() => setTab("wardrobe")} />
        )}

        {tab === "plans" && (
          <OutfitLibrary
            outfits={outfits}
            collections={collections}
            planner={planner}
            onChanged={refreshEverything}
            notify={notify}
            onGenerate={() => setTab("generate")}
          />
        )}
      </div>
    </div>
  );
}
