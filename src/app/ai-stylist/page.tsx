import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { MessageCircle, Sparkles } from "lucide-react";
import { isGeminiConfigured } from "@/lib/gemini";
import { StylistForm } from "@/components/stylist-form";
import { Eyebrow } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Stylist",
  description:
    "Build complete outfits within your budget. Choose occasion, style, colours and fit — the AI stylist assembles the look and explains every choice.",
};

export default function AiStylistPage() {
  const configured = isGeminiConfigured();

  return (
    <div>
      <section className="border-b border-ink/10 bg-cream">
        <div className="container-ww py-12 sm:py-16">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <Eyebrow>AI Stylist</Eyebrow>
              <h1 className="display mt-4 max-w-2xl text-[clamp(2.3rem,4.6vw,3.8rem)]">
                Tell us the brief.
                <br />
                We&apos;ll build the outfit.
              </h1>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-graphite">
                Three complete looks, assembled only from real catalogue pieces, priced in full and
                explained in plain English. Adjust anything and generate again.
              </p>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <span className="inline-flex items-center gap-2 border border-ink/15 bg-paper px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-graphite">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${configured ? "bg-emerald-600" : "bg-clay"}`}
                />
                {configured ? "Live AI styling active" : "Built-in styling engine active"}
              </span>
              <Link
                href="/ai-stylist/assistant"
                className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-smoke hover:text-ink"
              >
                <MessageCircle className="h-3.5 w-3.5" /> Or ask a styling question
              </Link>
            </div>
          </div>

          {!configured && (
            <div className="mt-8 flex items-start gap-3 border border-ink/10 bg-paper p-4">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-clay" />
              <p className="text-[11px] leading-relaxed text-smoke">
                <span className="text-ink">Demo mode.</span> Live Gemini recommendations activate
                automatically when <code className="text-ink">GEMINI_API_KEY</code> is set in the
                environment. Until then the built-in styling engine produces the same complete,
                budget-aware outfits — no features are disabled.
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="container-ww py-12">
        <Suspense fallback={<div className="py-16 text-sm text-smoke">Loading the stylist…</div>}>
          <StylistForm aiConfigured={configured} />
        </Suspense>
      </div>
    </div>
  );
}
