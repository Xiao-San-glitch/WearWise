import Link from "next/link";
import { ArrowRight, ArrowUpRight, Sparkles, Star } from "lucide-react";
import { getProducts } from "@/lib/db";
import { buildOutfits } from "@/lib/recommend";
import type { StylistPreferences } from "@/lib/types";
import { ProductGrid } from "@/components/product-grid";
import { OutfitComboCard } from "@/components/outfit-combo-card";
import { SmartImage } from "@/components/smart-image";
import { NewsletterForm } from "@/components/newsletter-form";
import { Eyebrow, SectionHeading, TextLink } from "@/components/ui";
import { inr } from "@/lib/format";

export const dynamic = "force-dynamic";

const FEATURED_CATEGORIES = [
  {
    label: "Women",
    caption: "Fluid tailoring, soft structure",
    href: "/women",
    image: "/products/31651963.jpg",
    className: "md:col-span-2 md:row-span-2 aspect-[4/5] md:aspect-auto",
  },
  {
    label: "Men",
    caption: "Considered essentials",
    href: "/men",
    image: "/products/1043474.jpg",
    className: "aspect-[4/5]",
  },
  {
    label: "Streetwear",
    caption: "Oversized, washed, layered",
    href: "/streetwear",
    image: "/products/32430590.jpg",
    className: "aspect-[4/5]",
  },
  {
    label: "Casual Wear",
    caption: "Denim and cotton ease",
    href: "/shop?style=Casual",
    image: "/products/4109797.jpg",
    className: "aspect-[4/5]",
  },
  {
    label: "Formal Wear",
    caption: "Sharp lines for the long day",
    href: "/shop?style=Formal",
    image: "/products/16341730.jpg",
    className: "aspect-[4/5]",
  },
  {
    label: "Accessories",
    caption: "The finishing edits",
    href: "/shop?category=Accessories",
    image: "/products/932401.jpg",
    className: "aspect-[4/5] md:col-span-2",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "I typed “minimalist office outfit under ₹4,000” and got a full look I actually wore to my internship. The stylist explained why each piece worked.",
    name: "Ananya S.",
    meta: "Student · Bengaluru",
  },
  {
    quote:
      "The budget filter is the real thing. It never pushed me over, and the alternative option made the outfit more affordable without losing the vibe.",
    name: "Rohit M.",
    meta: "Product designer · Pune",
  },
  {
    quote:
      "I found a wedding saree and shoes together, with the total shown up front. It felt like having a stylist who knows Myntra pricing.",
    name: "Meera K.",
    meta: "Marketing lead · Mumbai",
  },
];

const LOOK_BRIEFS: StylistPreferences[] = [
  {
    audience: "women",
    budget: 6000,
    budgetLabel: "₹2,000 – ₹5,000",
    occasion: "Date",
    style: "Aesthetic",
    colors: ["Cream", "Black"],
    season: "Summer",
    categories: [],
    fit: "regular",
    instructions: "",
  },
  {
    audience: "men",
    budget: 4500,
    budgetLabel: "₹2,000 – ₹5,000",
    occasion: "College",
    style: "Streetwear",
    colors: ["Black"],
    season: "Winter",
    categories: [],
    fit: "oversized",
    instructions: "",
  },
  {
    audience: "women",
    budget: 12000,
    budgetLabel: "₹5,000+",
    occasion: "Wedding",
    style: "Traditional",
    colors: ["Red", "Cream"],
    season: "All-season",
    categories: ["Ethnic Wear"],
    fit: "regular",
    instructions: "",
  },
];

export default async function HomePage() {
  const products = getProducts();
  const trending = [...products].sort((a, b) => b.popularity - a.popularity).slice(0, 4);
  const newArrivals = [...products]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);
  const looks = LOOK_BRIEFS.flatMap((brief) => buildOutfits(brief, products).slice(0, 1));
  const brands = new Set(products.map((product) => product.brand)).size;

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-cream">
        <div className="grid lg:grid-cols-2">
          <div className="flex items-center px-5 py-16 sm:px-8 lg:pl-12 lg:py-24 xl:pl-20">
            <div className="max-w-xl">
              <div className="flex items-center gap-3 animate-fadeIn">
                <span className="h-px w-8 bg-ink/40" />
                <span className="text-[10px] uppercase tracking-widest2 text-smoke">
                  Autumn / Winter 2026 · AI Studio
                </span>
              </div>
              <h1 className="display mt-6 text-[clamp(2.9rem,6vw,5.2rem)] animate-fadeUp">
                Discover Your
                <br />
                Perfect Style.
              </h1>
              <p className="mt-6 max-w-md text-[15px] leading-relaxed text-graphite animate-fadeUp animate-delay-100">
                Fashion recommendations tailored to your style, occasion, and budget — assembled
                from real Indian labels, and explained by an AI stylist.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3 animate-fadeUp animate-delay-200">
                <Link href="/ai-stylist" className="btn-primary">
                  <Sparkles className="h-3.5 w-3.5" /> Find My Style
                </Link>
                <Link href="/shop" className="btn-secondary">
                  Explore Collection <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <dl className="mt-14 grid max-w-md grid-cols-3 gap-6 border-t border-ink/10 pt-6 animate-fadeUp animate-delay-300">
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.14em] text-smoke">Pieces</dt>
                  <dd className="mt-1 font-display text-2xl">{products.length}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.14em] text-smoke">Labels</dt>
                  <dd className="mt-1 font-display text-2xl">{brands}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.14em] text-smoke">Looks</dt>
                  <dd className="mt-1 font-display text-2xl">3 / brief</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="relative min-h-[440px] sm:min-h-[560px] lg:min-h-[720px]">
            <SmartImage
              src="/products/291762.jpg"
              alt="Editorial fashion portrait in a burgundy coat with shopping bags"
              priority
              wrapperClassName="absolute inset-0"
              className="object-[50%_30%]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-5 right-5 sm:bottom-8 sm:left-8 sm:right-8">
              <div className="flex flex-col gap-4 bg-paper/95 p-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {["/products/6764031.jpg", "/products/1670765.jpg", "/products/932401.jpg"].map(
                      (image) => (
                        <span
                          key={image}
                          className="h-11 w-11 overflow-hidden rounded-full border-2 border-paper"
                        >
                          <img src={image} alt="" className="h-full w-full object-cover" />
                        </span>
                      ),
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-smoke">
                      Styled by WearWise AI
                    </p>
                    <p className="mt-1 text-sm font-medium">Weekend in the city · {inr(6878)}</p>
                  </div>
                </div>
                <Link
                  href="/ai-stylist"
                  className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-ink"
                >
                  Recreate this <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value strip */}
      <section className="border-y border-ink/10 bg-paper">
        <div className="container-ww grid grid-cols-2 gap-y-6 py-7 text-center md:grid-cols-4">
          {[
            ["Budget-first styling", "Never over your limit"],
            ["Real Indian labels", "Shop the exact piece"],
            ["Explained, not guessed", "Every choice reasoned"],
            ["Free, forever", "No subscription"],
          ].map(([title, sub]) => (
            <div key={title} className="px-3">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em]">{title}</p>
              <p className="mt-1 text-[11px] text-stone">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container-ww py-16 sm:py-24">
        <SectionHeading
          eyebrow="Shop by category"
          title="Six ways to dress well"
          description="Start with a category, or let the stylist assemble everything for you."
          action={<TextLink href="/shop">Shop all categories</TextLink>}
        />
        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 md:grid-rows-3">
          {FEATURED_CATEGORIES.map((category) => (
            <Link
              key={category.label}
              href={category.href}
              className={`group relative overflow-hidden bg-sand ${category.className}`}
            >
              <SmartImage
                src={category.image}
                alt={category.label}
                className="transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                label={category.label}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/5 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
                <div>
                  <p className="font-display text-2xl text-cream">{category.label}</p>
                  <p className="mt-0.5 text-[11px] text-cream/70">{category.caption}</p>
                </div>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cream/40 text-cream transition-colors group-hover:bg-cream group-hover:text-ink">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending */}
      <section className="container-ww pb-16 sm:pb-24">
        <SectionHeading
          eyebrow="Trending now"
          title="What everyone is wearing"
          description="The pieces our stylist keeps reaching for this week."
          action={<TextLink href="/shop?sort=popularity">View all trending</TextLink>}
        />
        <ProductGrid products={trending} className="mt-10" />
      </section>

      {/* AI stylist promo */}
      <section className="bg-ink text-cream">
        <div className="container-ww grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-2">
          <div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest2 text-cream/60">
              <Sparkles className="h-3.5 w-3.5" /> The WearWise stylist
            </div>
            <h2 className="display mt-6 text-[clamp(2.2rem,4.4vw,3.6rem)] text-cream">
              A stylist that
              <br />
              explains itself.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-cream/70">
              Tell us the occasion, the budget and the mood. We build complete outfits from the
              catalogue — then show the reasoning behind every choice, so you learn your own style
              along the way.
            </p>

            <ol className="mt-9 space-y-5">
              {[
                ["01", "Set your brief", "Occasion, budget, colours, fit and season in one screen."],
                ["02", "Get three complete looks", "Top, bottom, shoes, layer and accessories, priced in full."],
                ["03", "Refine and save", "Cheaper, more formal, different colour — regenerate in one tap."],
              ].map(([number, title, copy]) => (
                <li key={number} className="flex gap-5 border-t border-cream/15 pt-4">
                  <span className="pt-1 text-[10px] tracking-[0.18em] text-cream/40">{number}</span>
                  <div>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-cream/55">{copy}</p>
                  </div>
                </li>
              ))}
            </ol>

            <Link href="/ai-stylist" className="btn-cream mt-9">
              Build my look <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/5] overflow-hidden">
              <SmartImage
                src="/products/31651963.jpg"
                alt="Fashion editorial portrait in a cobalt dress"
                className="object-[50%_25%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/50 to-transparent" />
            </div>
            <div className="absolute -bottom-6 -left-2 w-[86%] max-w-sm border border-cream/15 bg-cream p-5 text-ink shadow-lift sm:-left-8">
              <p className="text-[10px] uppercase tracking-[0.16em] text-smoke">
                Why this works · AI note
              </p>
              <p className="mt-2 font-display text-lg leading-snug">
                “The cobalt drape carries the evening, so the accessories stay minimal.”
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-3">
                <span className="text-[11px] uppercase tracking-[0.14em] text-smoke">Total look</span>
                <span className="text-sm font-medium">{inr(7897)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New arrivals */}
      <section className="container-ww py-16 sm:py-24">
        <SectionHeading
          eyebrow="Just landed"
          title="New arrivals"
          description="Fresh drops from the labels we love, added this season."
          action={<TextLink href="/new-in">Shop new in</TextLink>}
        />
        <ProductGrid products={newArrivals} className="mt-10" />
      </section>

      {/* Outfit combinations */}
      <section className="bg-cream py-16 sm:py-24">
        <div className="container-ww">
          <SectionHeading
            eyebrow="Complete looks"
            title="Popular outfit combinations"
            description="Three looks our stylist has already assembled — shop each piece individually or take the whole look."
            action={<TextLink href="/ai-stylist">Style my own</TextLink>}
          />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {looks.map((outfit, index) => (
              <OutfitComboCard key={outfit.id} outfit={outfit} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Editorial */}
      <section className="container-ww py-16 sm:py-24">
        <div className="relative overflow-hidden">
          <div className="relative min-h-[420px] sm:min-h-[500px]">
            <SmartImage
              src="/products/9391678.jpg"
              alt="Two guests in jewel-toned evening dresses with a gold clutch"
              className="object-[50%_40%]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-ink/25 to-transparent" />
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-lg p-8 sm:p-14">
                <Eyebrow className="text-cream/60">The occasion edit</Eyebrow>
                <h2 className="display mt-4 text-[clamp(2rem,4vw,3.4rem)] text-cream">
                  Wedding season,
                  <br />
                  styled.
                </h2>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream/70">
                  Sarees, gowns and the jewellery-adjacent finishes — curated for long ceremonies
                  and longer photographs.
                </p>
                <Link href="/shop?category=Ethnic%20Wear" className="btn-cream mt-7">
                  Shop ethnic wear <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container-ww pb-16 sm:pb-24">
        <SectionHeading
          eyebrow="From the community"
          title="Styled, worn, repeated"
          align="center"
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((testimonial) => (
            <figure key={testimonial.name} className="flex flex-col border-t border-ink/15 pt-6">
              <div className="flex gap-0.5 text-ink">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="h-3 w-3 fill-ink" />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 font-display text-lg leading-snug text-graphite">
                “{testimonial.quote}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-[11px] text-cream">
                  {testimonial.name.charAt(0)}
                </span>
                <div>
                  <p className="text-xs font-medium">{testimonial.name}</p>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-stone">
                    {testimonial.meta}
                  </p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="border-y border-ink/10 bg-cream">
        <div className="container-ww grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-2">
          <div>
            <Eyebrow>The WearWise Edit</Eyebrow>
            <h2 className="display mt-4 text-[clamp(2rem,3.6vw,3rem)]">
              Your next favourite outfit
              <br />
              is one prompt away.
            </h2>
          </div>
          <div className="lg:max-w-md lg:justify-self-end">
            <p className="mb-5 text-sm leading-relaxed text-smoke">
              Join the list for new drops, styling notes and the occasional AI-curated lookbook.
              Start with a prompt instead if you&apos;d rather shop now.
            </p>
            <NewsletterForm />
            <Link href="/ai-stylist" className="btn-secondary mt-6">
              Try the AI stylist <Sparkles className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
