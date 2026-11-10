import type { Metadata } from "next";
import Link from "next/link";
import { Search as SearchIcon, Sparkles } from "lucide-react";
import { getProducts } from "@/lib/db";
import { applyInterpretation, filterProducts } from "@/lib/search";
import { interpretSearch } from "@/lib/search-intelligence";
import { ProductGrid } from "@/components/product-grid";
import { ProductFilters, SortSelect } from "@/components/product-filters";
import { EmptyState, Eyebrow } from "@/components/ui";
import { COLORS, STYLES } from "@/lib/seed";
import { inr } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search",
  description: "Search the WearWise catalogue with natural language — budget, colour, style and occasion.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const products = getProducts();

  const sort = (typeof params.sort === "string" ? params.sort : "featured") as
    | "featured"
    | "price-asc"
    | "price-desc"
    | "newest"
    | "popularity"
    | "discount";

  if (!query) {
    return (
      <div className="container-ww py-16 sm:py-24">
        <Eyebrow>Smart fashion search</Eyebrow>
        <h1 className="display mt-4 max-w-2xl text-[clamp(2.2rem,4.4vw,3.6rem)]">
          Describe the piece. We&apos;ll find it.
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-graphite">
          Search in plain English — budget, colour, fit and occasion are all understood. Try one of
          these to start.
        </p>
        <div className="mt-8 flex max-w-2xl flex-wrap gap-2">
          {[
            "Black oversized t-shirt under ₹1,000",
            "Minimalist office outfit under ₹4,000",
            "Wedding saree under ₹8,000",
            "White sneakers",
          ].map((example) => (
            <Link key={example} href={`/search?q=${encodeURIComponent(example)}`} className="chip">
              {example}
            </Link>
          ))}
        </div>
        <div className="mt-12 max-w-2xl border-t border-ink/10 pt-6">
          <Link href="/ai-stylist" className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.16em]">
            <Sparkles className="h-3.5 w-3.5" /> Or build a full outfit with the AI stylist →
          </Link>
        </div>
      </div>
    );
  }

  const interpreted = await interpretSearch(query);
  const baseFilters = applyInterpretation(interpreted);
  let results = filterProducts(products, { ...baseFilters, sort });
  if (!results.length) {
    results = filterProducts(products, { q: query, sort });
  }

  const chips = [
    ...interpreted.categories,
    ...interpreted.colors,
    ...interpreted.styles,
    interpreted.fit ? `${interpreted.fit} fit` : "",
    interpreted.occasion ?? "",
    interpreted.audience ? `For ${interpreted.audience}` : "",
    interpreted.maxPrice ? `Under ${inr(interpreted.maxPrice)}` : "",
    interpreted.minPrice ? `Above ${inr(interpreted.minPrice)}` : "",
  ].filter(Boolean);

  const colorOptions = COLORS.map((color) => ({
    value: color,
    count: products.filter((product) => product.colors.includes(color)).length,
  })).filter((option) => option.count > 0);
  const styleOptions = STYLES.map((style) => ({
    value: style,
    count: products.filter((product) => product.styles.includes(style)).length,
  })).filter((option) => option.count > 0);
  const brandCounts = new Map<string, number>();
  for (const product of products) {
    brandCounts.set(product.brand, (brandCounts.get(product.brand) ?? 0) + 1);
  }

  return (
    <div>
      <section className="border-b border-ink/10 bg-cream">
        <div className="container-ww py-10 sm:py-14">
          <Eyebrow>Search results</Eyebrow>
          <h1 className="display mt-3 max-w-3xl text-[clamp(1.9rem,3.8vw,3rem)]">“{query}”</h1>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-smoke">
              {interpreted.source === "ai" ? (
                <>
                  <Sparkles className="h-3 w-3" /> AI understood
                </>
              ) : (
                <>
                  <SearchIcon className="h-3 w-3" /> Smart filters
                </>
              )}
            </span>
            {chips.map((chip) => (
              <span key={chip} className="rounded-full border border-ink/20 bg-paper px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-graphite">
                {chip}
              </span>
            ))}
            {chips.length === 0 && (
              <span className="text-[11px] text-smoke">Searching the full catalogue by keyword.</span>
            )}
          </div>
        </div>
      </section>

      <div className="container-ww py-9">
        <div className="flex flex-col gap-10 lg:flex-row">
          <ProductFilters
            brands={[...brandCounts.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => a.value.localeCompare(b.value))}
            colors={colorOptions}
            styles={styleOptions}
            categories={[]}
            priceRange={{
              min: Math.min(...products.map((product) => product.price)),
              max: Math.max(...products.map((product) => product.price)),
            }}
            showCategories={false}
          />
          <div className="min-w-0 flex-1">
            <SortSelect total={results.length} />
            <div className="mt-6">
              {results.length ? (
                <ProductGrid products={results} columns={3} />
              ) : (
                <EmptyState
                  icon={<SearchIcon className="h-7 w-7" />}
                  title="Nothing matched that search"
                  description="Try describing the piece differently, or let the AI stylist build an outfit around the occasion and budget instead."
                  action={
                    <div className="flex flex-wrap justify-center gap-3">
                      <Link href="/shop" className="btn-secondary">
                        Browse everything
                      </Link>
                      <Link href="/ai-stylist" className="btn-primary">
                        <Sparkles className="h-3.5 w-3.5" /> Ask the stylist
                      </Link>
                    </div>
                  }
                />
              )}
            </div>
            {results.length > 0 && (
              <p className="mt-12 border-t border-ink/10 pt-6 text-[11px] leading-relaxed text-stone">
                {results.length} {results.length === 1 ? "piece" : "pieces"} found. Results are
                ranked by relevance to your query, then filtered by the attributes we understood.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
