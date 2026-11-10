import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Layers, Shirt, Sparkles, Wallet } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import {
  getWardrobeCollectionsForUser,
  getWardrobeForUser,
  getWardrobeOutfitsForUser,
  getWardrobePlannerForUser,
} from "@/lib/db";
import { scoreWardrobeOutfit, wardrobeStats } from "@/lib/wardrobe";
import { inr } from "@/lib/format";
import { ClosetShell } from "@/components/closet/closet-shell";
import { type ClosetTab, isClosetTab } from "@/lib/closet";
import type { WardrobeItem, WardrobeOutfitView } from "@/lib/types";
import { Eyebrow } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Smart Closet & Budget Optimizer",
  description:
    "Digitise your wardrobe, generate outfits from the clothes you own, find the missing pieces that unlock the most combinations and plan your week.",
};

export default async function ClosetPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/closet");

  const { tab } = await searchParams;
  const initialTab: ClosetTab = isClosetTab(tab) ? tab : "wardrobe";

  const items = getWardrobeForUser(user.id);
  const byId = new Map(items.map((item) => [item.id, item]));
  const outfits: WardrobeOutfitView[] = getWardrobeOutfitsForUser(user.id)
    .map((outfit) => {
      const pieces = outfit.itemIds
        .map((id) => byId.get(id))
        .filter((item): item is WardrobeItem => Boolean(item));
      return {
        ...outfit,
        items: pieces,
        gaps: [],
        score: scoreWardrobeOutfit(pieces, outfit),
      };
    })
    .filter((outfit) => outfit.items.length > 0)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const collections = getWardrobeCollectionsForUser(user.id);
  const planner = getWardrobePlannerForUser(user.id);
  const stats = wardrobeStats(items);

  return (
    <div>
      <section className="border-b border-ink/10 bg-cream">
        <div className="container-ww py-10 sm:py-14">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:items-end">
            <div>
              <Eyebrow>WearWise Smart Closet</Eyebrow>
              <h1 className="display mt-4 max-w-2xl text-[clamp(2.2rem,5vw,4rem)]">
                Your wardrobe, working harder.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-graphite sm:text-[15px]">
                Look better. Buy smarter. Spend less. Digitise what you already own, build outfits from
                those exact pieces, then see which single purchase unlocks the most new looks.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link href="/closet?tab=generate" className="btn-primary py-2.5 text-[10px]">
                  <Sparkles className="h-3.5 w-3.5" /> Build an outfit
                </Link>
                <Link href="/closet?tab=missing" className="btn-secondary py-2.5 text-[10px]">
                  Find missing pieces <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-px border border-ink/15 bg-ink/15">
              <div className="bg-paper p-4">
                <p className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.12em] text-smoke">
                  <Shirt className="h-3 w-3" /> Pieces
                </p>
                <p className="mt-1.5 font-display text-3xl">{items.length}</p>
              </div>
              <div className="bg-paper p-4">
                <p className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.12em] text-smoke">
                  <Sparkles className="h-3 w-3" /> Saved looks
                </p>
                <p className="mt-1.5 font-display text-3xl">{outfits.length}</p>
              </div>
              <div className="bg-paper p-4">
                <p className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.12em] text-smoke">
                  <Layers className="h-3 w-3" /> Base combinations
                </p>
                <p className="mt-1.5 font-display text-3xl tabular">{stats.combinations}</p>
              </div>
              <div className="bg-paper p-4">
                <p className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.12em] text-smoke">
                  <Wallet className="h-3 w-3" /> Closet value
                </p>
                <p className="mt-1.5 font-display text-2xl tabular">{inr(stats.value)}</p>
              </div>
            </div>
          </div>

          <p className="mt-5 border-t border-ink/10 pt-4 text-[10px] leading-relaxed text-stone">
            Your wardrobe stays on your account — never public, never sold. Combinations and versatility
            scores are transparent estimates from pairing rules, not AI predictions.
          </p>
        </div>
      </section>

      <ClosetShell
        initialItems={items}
        initialOutfits={outfits}
        initialCollections={collections}
        initialPlanner={planner}
        initialTab={initialTab}
      />
    </div>
  );
}
