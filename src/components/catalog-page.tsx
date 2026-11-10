import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import type { Product } from "@/lib/types";
import { filterProducts, type ProductFilters } from "@/lib/search";
import { ProductFilters as FilterPanel, SortSelect } from "./product-filters";
import { ProductGrid } from "./product-grid";
import { Eyebrow, EmptyState } from "./ui";
import { SmartImage } from "./smart-image";
import { COLORS, STYLES } from "@/lib/seed";

type SearchParams = Record<string, string | string[] | undefined>;

export function toList(value: string | string[] | undefined): string[] {
  if (!value) return [];
  const values = Array.isArray(value) ? value : [value];
  return values.flatMap((item) => item.split(",")).map((item) => item.trim()).filter(Boolean);
}

function countBy(products: Product[], key: "brand" | "category"): { value: string; count: number }[] {
  const map = new Map<string, number>();
  for (const product of products) {
    map.set(product[key], (map.get(product[key]) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => a.value.localeCompare(b.value));
}

interface CatalogPageProps {
  title: string;
  eyebrow: string;
  description: string;
  products: Product[];
  searchParams: SearchParams;
  heroImage?: string;
  heroCaption?: string;
  lockedAudience?: string[];
  lockedStyle?: string[];
  lockedCategory?: string[];
  defaultSort?: string;
}

export function CatalogPage({
  title,
  eyebrow,
  description,
  products,
  searchParams,
  heroImage,
  heroCaption,
  lockedAudience,
  lockedStyle,
  lockedCategory,
  defaultSort,
}: CatalogPageProps) {
  const base = products.filter((product) => {
    if (lockedAudience?.length && !lockedAudience.includes(product.audience) && product.audience !== "unisex") {
      return false;
    }
    if (lockedStyle?.length && !product.styles.some((style) => lockedStyle.includes(style))) {
      return false;
    }
    if (lockedCategory?.length && !lockedCategory.includes(product.category)) {
      return false;
    }
    return true;
  });

  const params = searchParams;
  const SORT_VALUES: NonNullable<ProductFilters["sort"]>[] = [
    "featured",
    "price-asc",
    "price-desc",
    "newest",
    "popularity",
    "discount",
  ];
  const rawSort = typeof params.sort === "string" ? params.sort : undefined;
  const requestedSort = (rawSort ?? defaultSort ?? "featured") as NonNullable<ProductFilters["sort"]>;
  const filters: ProductFilters = {
    categories: toList(params.category).filter((category) =>
      base.some((product) => product.category === category),
    ),
    brands: toList(params.brand),
    colors: toList(params.color),
    styles: toList(params.style),
    minPrice: params.min ? Number(params.min) : undefined,
    maxPrice: params.max ? Number(params.max) : undefined,
    sort: SORT_VALUES.includes(requestedSort) ? requestedSort : "featured",
  };

  const filtered = filterProducts(base, filters);
  const priceRange = {
    min: Math.min(...base.map((product) => product.price)),
    max: Math.max(...base.map((product) => product.price)),
  };

  const colorOptions = COLORS.map((color) => ({
    value: color,
    count: base.filter((product) => product.colors.includes(color)).length,
  })).filter((option) => option.count > 0);

  const styleOptions = STYLES.map((style) => ({
    value: style,
    count: base.filter((product) => product.styles.includes(style)).length,
  })).filter((option) => option.count > 0);

  const hasFilters =
    Boolean(filters.categories?.length || filters.brands?.length || filters.colors?.length || filters.styles?.length) ||
    Boolean(params.min || params.max);

  return (
    <div>
      {heroImage ? (
        <section className="relative border-b border-ink/10 bg-cream">
          <div className="grid md:grid-cols-2">
            <div className="flex flex-col justify-center px-5 py-12 sm:px-8 md:px-12 md:py-16">
              <Eyebrow>{eyebrow}</Eyebrow>
              <h1 className="display mt-4 text-[clamp(2.4rem,4.6vw,4rem)]">{title}</h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-graphite">{description}</p>
              {heroCaption && (
                <p className="mt-6 text-[11px] uppercase tracking-[0.14em] text-stone">{heroCaption}</p>
              )}
            </div>
            <div className="relative min-h-[260px] md:min-h-[360px]">
              <SmartImage src={heroImage} alt={title} wrapperClassName="absolute inset-0" priority />
            </div>
          </div>
        </section>
      ) : (
        <section className="border-b border-ink/10 bg-cream">
          <div className="container-ww py-12 sm:py-16">
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1 className="display mt-4 text-[clamp(2.4rem,4.6vw,4rem)]">{title}</h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-graphite">{description}</p>
          </div>
        </section>
      )}

      <div className="container-ww py-9">
        <div className="flex flex-col gap-10 lg:flex-row">
          <FilterPanel
            brands={countBy(base, "brand")}
            colors={colorOptions}
            styles={styleOptions}
            categories={countBy(base, "category")}
            priceRange={priceRange}
            showCategories={!lockedCategory?.length}
          />

          <div className="min-w-0 flex-1">
            <SortSelect total={filtered.length} />

            <div className="mt-6">
              {filtered.length > 0 ? (
                <ProductGrid products={filtered} columns={3} />
              ) : (
                <EmptyState
                  icon={<SlidersHorizontal className="h-7 w-7" />}
                  title="No pieces match those filters"
                  description="Try widening your price range or removing a filter. The stylist can also suggest alternatives that are close to what you're after."
                  action={
                    <div className="flex flex-wrap justify-center gap-3">
                      <Link href="?" className="btn-secondary">
                        Reset filters
                      </Link>
                      <Link href="/ai-stylist" className="btn-primary">
                        Ask the stylist
                      </Link>
                    </div>
                  }
                />
              )}
            </div>

            {filtered.length > 0 && (
              <p className="mt-12 border-t border-ink/10 pt-6 text-[11px] leading-relaxed text-stone">
                {hasFilters
                  ? `Showing ${filtered.length} of ${base.length} pieces matching your filters.`
                  : `Showing all ${base.length} pieces in this edit.`}{" "}
                Prices are indicative and set by the partner retailer. WearWise may earn a
                commission on outbound links.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
