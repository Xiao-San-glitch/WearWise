import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { SmartImage } from "@/components/smart-image";
import { Eyebrow, SectionHeading } from "@/components/ui";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "WearWise AI is a fashion discovery platform that turns your style, occasion and budget into complete outfits from real Indian labels.",
};

const VALUES = [
  {
    title: "Budget is a design constraint",
    copy: "A stylist that ignores your budget isn't styling you. Every look is assembled against a hard ceiling, and we show the remaining amount up front.",
  },
  {
    title: "Explain the choice",
    copy: "Recommendations should teach you something. Each outfit comes with a reason — why this silhouette, this colour, this layer.",
  },
  {
    title: "Real pieces, real prices",
    copy: "We only recommend products that exist in the catalogue, with the retailer and price visible before you leave.",
  },
  {
    title: "No dark patterns",
    copy: "No fake urgency, no invented discounts, no pretending to process payments. If a link is sponsored, it says so.",
  },
];

const SIZE_GUIDE = [
  { size: "XS", chest: "34", waist: "28", hip: "36" },
  { size: "S", chest: "36", waist: "30", hip: "38" },
  { size: "M", chest: "38", waist: "32", hip: "40" },
  { size: "L", chest: "40", waist: "34", hip: "42" },
  { size: "XL", chest: "42", waist: "36", hip: "44" },
  { size: "XXL", chest: "44", waist: "38", hip: "46" },
];

export default function AboutPage() {
  return (
    <div>
      <section className="border-b border-ink/10 bg-cream">
        <div className="container-ww grid gap-10 py-14 sm:py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <Eyebrow>About WearWise AI</Eyebrow>
            <h1 className="display mt-4 text-[clamp(2.4rem,5vw,4.2rem)]">
              Fashion advice that
              <br />
              respects your budget.
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-graphite">
              WearWise AI started with a simple frustration: online shopping gives you infinite
              options and no point of view. We built a stylist that starts from your occasion, your
              budget and your taste — then assembles a complete look from real Indian labels and
              explains why it works.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/ai-stylist" className="btn-primary">
                <Sparkles className="h-3.5 w-3.5" /> Try the stylist
              </Link>
              <Link href="/shop" className="btn-secondary">
                Browse the catalogue <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden">
            <SmartImage
              src="/products/9391688.jpg"
              alt="Guests in evening dresses at a celebration"
              className="object-[50%_35%]"
            />
          </div>
        </div>
      </section>

      <section className="container-ww py-16">
        <SectionHeading
          eyebrow="What we believe"
          title="Four rules we don't break"
          description="These principles shape the catalogue, the stylist and every link we publish."
        />
        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          {VALUES.map((value, index) => (
            <div key={value.title} className="border-t border-ink/15 pt-5">
              <p className="text-[10px] uppercase tracking-[0.16em] text-stone">
                0{index + 1}
              </p>
              <h3 className="mt-2 font-display text-xl">{value.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-smoke">{value.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-ink text-cream">
        <div className="container-ww grid gap-10 py-16 lg:grid-cols-2 lg:items-center">
          <div>
            <Eyebrow className="text-cream/50">How the AI works</Eyebrow>
            <h2 className="display mt-4 text-[clamp(2rem,3.8vw,3rem)]">
              A stylist, not a
              <br />
              search engine.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-cream/70">
              Your brief is turned into a structured styling request. The model receives only the
              catalogue — product IDs, prices, colours, fits and occasions — and must build outfits
              from those pieces. Every returned ID is validated against the database, and the total
              is recalculated server-side so a look can never exceed your budget.
            </p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-cream/70">
              If the AI service is unavailable, a deterministic styling engine takes over using the
              same catalogue and the same budget rules. The experience never breaks.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["01", "Brief", "Occasion, budget, colours, fit, season."],
              ["02", "Retrieve", "Filter the catalogue to eligible pieces."],
              ["03", "Compose", "Build complete looks within the ceiling."],
              ["04", "Explain", "Justify each piece in plain language."],
            ].map(([number, title, copy]) => (
              <div key={number} className="border border-cream/15 p-5">
                <p className="text-[10px] tracking-[0.18em] text-cream/40">{number}</p>
                <p className="mt-2 font-display text-xl">{title}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-cream/60">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="size-guide" className="container-ww scroll-mt-24 py-16">
        <SectionHeading
          eyebrow="Size guide"
          title="Find your fit"
          description="Measurements in inches, body measurements. If you're between sizes, size up for oversized fits and down for slim fits."
        />
        <div className="mt-8 overflow-x-auto border border-ink/10">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 bg-cream text-[10px] uppercase tracking-[0.14em] text-smoke">
                <th className="px-4 py-3 font-medium">Size</th>
                <th className="px-4 py-3 font-medium">Chest</th>
                <th className="px-4 py-3 font-medium">Waist</th>
                <th className="px-4 py-3 font-medium">Hip</th>
              </tr>
            </thead>
            <tbody>
              {SIZE_GUIDE.map((row) => (
                <tr key={row.size} className="border-b border-ink/5">
                  <td className="px-4 py-3 font-medium">{row.size}</td>
                  <td className="px-4 py-3 text-smoke">{row.chest}&quot;</td>
                  <td className="px-4 py-3 text-smoke">{row.waist}&quot;</td>
                  <td className="px-4 py-3 text-smoke">{row.hip}&quot;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-stone">
          Denim is sized in inches (waist). Footwear uses UK sizing. Fit can vary by label — check the
          product specifications for fabric and cut details.
        </p>
      </section>

      <section className="border-t border-ink/10 bg-cream">
        <div className="container-ww flex flex-col items-start justify-between gap-6 py-12 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-2xl">Ready to see it work?</h2>
            <p className="mt-1 text-sm text-smoke">Three looks, one brief, no sign-up required.</p>
          </div>
          <Link href="/ai-stylist" className="btn-primary">
            Find my style <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
