import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Sparkles } from "lucide-react";
import { getProductBySlug, getProducts } from "@/lib/db";
import { completeTheLook, relatedProducts } from "@/lib/search";
import { ProductGallery, PurchasePanel } from "@/components/product-detail-client";
import { ProductGrid } from "@/components/product-grid";
import { OutfitComboCard } from "@/components/outfit-combo-card";
import { buildOutfits } from "@/lib/recommend";
import { Eyebrow, SectionHeading } from "@/components/ui";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: `${product.name} — ${product.brand}`,
    description: product.description.slice(0, 155),
    openGraph: { images: [product.image] },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const products = getProducts();
  const related = relatedProducts(product, products, 4);
  const matchItems = completeTheLook(product, products, 3);
  const looks = matchItems.length
    ? buildOutfits(
        {
          audience: product.audience === "unisex" ? "women" : product.audience,
          budget: product.price + matchItems.reduce((sum, item) => sum + item.price, 0),
          budgetLabel: "Style this piece",
          occasion: product.occasions[0] ?? "Casual",
          style: product.styles[0] ?? "Minimalist",
          colors: product.colors.slice(0, 2),
          season: product.seasons[0] ?? "All-season",
          categories: [],
          fit: product.fit,
          instructions: product.name,
        },
        [product, ...matchItems, ...related],
      ).slice(0, 1)
    : [];

  return (
    <div>
      <nav aria-label="Breadcrumb" className="border-b border-ink/10">
        <div className="container-ww flex flex-wrap items-center gap-1.5 py-4 text-[10px] uppercase tracking-[0.12em] text-stone">
          <Link href="/" className="hover:text-ink">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/shop" className="hover:text-ink">Shop</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-ink">
            {product.category}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="truncate text-ink">{product.name}</span>
        </div>
      </nav>

      <section className="container-ww py-8 sm:py-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
          <ProductGallery product={product} />
          <PurchasePanel product={product} />
        </div>
      </section>

      <section className="border-y border-ink/10 bg-cream">
        <div className="container-ww grid gap-10 py-12 md:grid-cols-3">
          <div>
            <Eyebrow className="mb-3">The detail</Eyebrow>
            <p className="text-sm leading-relaxed text-graphite">{product.description}</p>
            <p className="mt-4 text-[11px] leading-relaxed text-stone">
              Style tags: {product.styles.join(", ")} · Fit: {product.fit} · Season:{" "}
              {product.seasons.join(", ")}
            </p>
          </div>
          <div>
            <Eyebrow className="mb-3">Specifications</Eyebrow>
            <dl className="space-y-2.5 text-sm">
              {product.specs.map((spec) => (
                <div key={spec.label} className="flex justify-between gap-6 border-b border-ink/10 pb-2.5">
                  <dt className="text-smoke">{spec.label}</dt>
                  <dd className="text-right text-graphite">{spec.value}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-6 border-b border-ink/10 pb-2.5">
                <dt className="text-smoke">Retailer</dt>
                <dd className="text-graphite">{product.retailer}</dd>
              </div>
              <div className="flex justify-between gap-6 border-b border-ink/10 pb-2.5">
                <dt className="text-smoke">Availability</dt>
                <dd className="text-graphite">{product.stock > 0 ? "In stock" : "Sold out"}</dd>
              </div>
            </dl>
          </div>
          <div>
            <Eyebrow className="mb-3">Styling notes</Eyebrow>
            {looks[0] ? (
              <>
                <p className="font-display text-lg leading-snug">“{looks[0].stylingTip}”</p>
                <p className="mt-3 text-sm leading-relaxed text-smoke">
                  Pair it with the {matchItems.map((item) => item.name).join(", ")} for a complete
                  look.
                </p>
                <Link
                  href={`/ai-stylist?piece=${encodeURIComponent(product.name)}`}
                  className="mt-5 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.14em]"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Style around this piece
                </Link>
              </>
            ) : (
              <p className="text-sm text-smoke">
                Pair this with neutral basics from the catalogue for an easy, considered look.
              </p>
            )}
          </div>
        </div>
      </section>

      {looks.length > 0 && (
        <section className="container-ww py-14">
          <SectionHeading
            eyebrow="Complete the look"
            title="Styled by WearWise AI"
            description="A ready-to-shop outfit built around this piece, priced as a set."
          />
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <OutfitComboCard outfit={looks[0]} index={0} />
            <div className="grid grid-cols-2 content-start gap-4">
              {matchItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/product/${item.slug}`}
                  className="group border border-ink/10 bg-paper p-3"
                >
                  <div className="aspect-[3/4] overflow-hidden bg-sand">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-smoke">{item.brand}</p>
                  <p className="text-xs">{item.name}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="container-ww pb-16">
        <SectionHeading eyebrow="You may also like" title="Similar pieces" />
        <ProductGrid products={related} className="mt-8" />
      </section>
    </div>
  );
}
