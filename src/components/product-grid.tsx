import type { Product } from "@/lib/types";
import { ProductCard } from "./product-card";
import { cn } from "@/lib/format";

export function ProductGrid({
  products,
  columns = 4,
  className,
}: {
  products: Product[];
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const cols = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
  } as const;

  return (
    <div className={cn("grid gap-x-4 gap-y-10 sm:gap-x-6", cols[columns], className)}>
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} priority={index < 4} />
      ))}
    </div>
  );
}
