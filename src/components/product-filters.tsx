"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { cn, inr } from "@/lib/format";

interface FilterOption {
  value: string;
  count: number;
}

interface ProductFiltersProps {
  brands: FilterOption[];
  colors: FilterOption[];
  styles: FilterOption[];
  categories: FilterOption[];
  priceRange: { min: number; max: number };
  showCategories?: boolean;
  showAudience?: boolean;
}

function useFilterState() {
  const searchParams = useSearchParams();
  const router = useRouter();

  function toggle(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const existing = params.getAll(key);
    params.delete(key);
    const next = existing.includes(value)
      ? existing.filter((item) => item !== value)
      : [...existing, value];
    next.forEach((item) => params.append(key, item));
    router.push(`?${params.toString()}`, { scroll: false });
  }

  function setRange(min: string, max: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (min) params.set("min", min);
    else params.delete("min");
    if (max) params.set("max", max);
    else params.delete("max");
    router.push(`?${params.toString()}`, { scroll: false });
  }

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString());
    ["brand", "color", "style", "category", "min", "max"].forEach((key) => params.delete(key));
    router.push(`?${params.toString()}`, { scroll: false });
  }

  return { searchParams, toggle, setRange, clearAll };
}

function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-ink/10 py-4">
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={open}
      >
        <span className="text-[11px] font-medium uppercase tracking-[0.16em]">{title}</span>
        <ChevronDown className={cn("h-4 w-4 text-smoke transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="mt-4 space-y-2.5">{children}</div>}
    </div>
  );
}

function CheckRow({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-graphite transition-colors hover:text-ink">
      <span
        className={cn(
          "flex h-4 w-4 items-center justify-center border transition-colors",
          checked ? "border-ink bg-ink text-cream" : "border-ink/25 bg-transparent",
        )}
      >
        {checked && (
          <svg viewBox="0 0 10 10" className="h-2.5 w-2.5 fill-none stroke-current stroke-2">
            <path d="M1.5 5.2 4 7.5 8.5 2.5" />
          </svg>
        )}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span className="flex-1">{label}</span>
      {count !== undefined && <span className="text-[10px] text-stone">{count}</span>}
    </label>
  );
}

export function ProductFilters({
  brands,
  colors,
  styles,
  categories,
  priceRange,
  showCategories = true,
}: ProductFiltersProps) {
  const { searchParams, toggle, setRange, clearAll } = useFilterState();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [minInput, setMinInput] = useState(searchParams.get("min") ?? "");
  const [maxInput, setMaxInput] = useState(searchParams.get("max") ?? "");

  useEffect(() => {
    setMinInput(searchParams.get("min") ?? "");
    setMaxInput(searchParams.get("max") ?? "");
  }, [searchParams]);

  const selected = {
    brand: searchParams.getAll("brand"),
    color: searchParams.getAll("color"),
    style: searchParams.getAll("style"),
    category: searchParams.getAll("category"),
  };
  const activeCount =
    selected.brand.length + selected.color.length + selected.style.length + selected.category.length +
    (searchParams.get("min") || searchParams.get("max") ? 1 : 0);

  const panel = (
    <div>
      <div className="flex items-center justify-between border-b border-ink pb-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em]">Filters</p>
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="text-[10px] uppercase tracking-[0.12em] text-smoke underline underline-offset-2 hover:text-ink"
          >
            Clear ({activeCount})
          </button>
        )}
      </div>

      <FilterSection title="Price">
        <div className="flex items-center gap-2">
          <input
            inputMode="numeric"
            value={minInput}
            onChange={(event) => setMinInput(event.target.value.replace(/\D/g, ""))}
            placeholder={`${priceRange.min}`}
            aria-label="Minimum price"
            className="w-full border border-ink/15 bg-transparent px-2.5 py-2 text-xs outline-none focus:border-ink"
          />
          <span className="text-stone">—</span>
          <input
            inputMode="numeric"
            value={maxInput}
            onChange={(event) => setMaxInput(event.target.value.replace(/\D/g, ""))}
            placeholder={`${priceRange.max}`}
            aria-label="Maximum price"
            className="w-full border border-ink/15 bg-transparent px-2.5 py-2 text-xs outline-none focus:border-ink"
          />
        </div>
        <button
          onClick={() => setRange(minInput, maxInput)}
          className="text-[10px] uppercase tracking-[0.14em] underline underline-offset-2 text-smoke hover:text-ink"
        >
          Apply range {minInput || maxInput ? `(${inr(Number(minInput || 0))} – ${inr(Number(maxInput || priceRange.max))})` : ""}
        </button>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {[
            { label: "Under ₹1,000", min: "", max: "1000" },
            { label: "₹1,000 – ₹2,500", min: "1000", max: "2500" },
            { label: "₹2,500 – ₹5,000", min: "2500", max: "5000" },
            { label: "₹5,000+", min: "5000", max: "" },
          ].map((bucket) => (
            <button
              key={bucket.label}
              onClick={() => setRange(bucket.min, bucket.max)}
              className={cn(
                "chip px-2.5 py-1 normal-case tracking-normal",
                minInput === bucket.min && maxInput === bucket.max && "chip-active",
              )}
            >
              {bucket.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {showCategories && (
        <FilterSection title="Category">
          {categories.map((category) => (
            <CheckRow
              key={category.value}
              label={category.value}
              count={category.count}
              checked={selected.category.includes(category.value)}
              onChange={() => toggle("category", category.value)}
            />
          ))}
        </FilterSection>
      )}

      <FilterSection title="Colour">
        {colors.map((color) => (
          <CheckRow
            key={color.value}
            label={color.value}
            count={color.count}
            checked={selected.color.includes(color.value)}
            onChange={() => toggle("color", color.value)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Style" defaultOpen={false}>
        {styles.map((style) => (
          <CheckRow
            key={style.value}
            label={style.value}
            count={style.count}
            checked={selected.style.includes(style.value)}
            onChange={() => toggle("style", style.value)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Brand" defaultOpen={false}>
        {brands.map((brand) => (
          <CheckRow
            key={brand.value}
            label={brand.value}
            count={brand.count}
            checked={selected.brand.includes(brand.value)}
            onChange={() => toggle("brand", brand.value)}
          />
        ))}
      </FilterSection>
    </div>
  );

  return (
    <>
      <div className="mb-6 flex items-center justify-between lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="inline-flex items-center gap-2 border border-ink/20 px-4 py-2.5 text-[11px] uppercase tracking-[0.14em]"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
          {activeCount > 0 && <span>({activeCount})</span>}
        </button>
      </div>

      <aside className="hidden w-[230px] shrink-0 lg:block">{panel}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-label="Close filters"
          />
          <div className="absolute inset-y-0 left-0 w-[88%] max-w-sm overflow-y-auto bg-paper p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-2xl">Filters</span>
              <button onClick={() => setMobileOpen(false)} aria-label="Close filters">
                <X className="h-5 w-5" />
              </button>
            </div>
            {panel}
            <button onClick={() => setMobileOpen(false)} className="btn-primary mt-6 w-full">
              Show results
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function SortSelect({ total }: { total: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const value = searchParams.get("sort") ?? "featured";

  return (
    <div className="flex items-center justify-between gap-4 border-b border-ink/10 pb-3">
      <p className="text-[11px] uppercase tracking-[0.14em] text-smoke">
        {total} {total === 1 ? "piece" : "pieces"}
      </p>
      <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-smoke">
        <span className="hidden sm:inline">Sort</span>
        <select
          value={value}
          onChange={(event) => {
            const params = new URLSearchParams(searchParams.toString());
            if (event.target.value === "featured") params.delete("sort");
            else params.set("sort", event.target.value);
            router.push(`?${params.toString()}`, { scroll: false });
          }}
          className="border border-ink/15 bg-paper px-3 py-2 text-[11px] uppercase tracking-[0.12em] text-ink outline-none focus:border-ink"
        >
          <option value="featured">Featured</option>
          <option value="popularity">Popularity</option>
          <option value="newest">Newest</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
          <option value="discount">Discount</option>
        </select>
      </label>
    </div>
  );
}
