import { getDb } from "@/lib/db";
import { AffiliateManager } from "@/components/affiliate-manager";
import { Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function AdminAffiliatePage() {
  const db = getDb();
  const sponsored = db.products.filter((product) => product.sponsored).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Monetisation</p>
          <h1 className="display mt-2 text-[clamp(1.8rem,3.2vw,2.6rem)]">Affiliate links</h1>
          <p className="mt-1 text-sm text-smoke">
            Replace demo retailer links with your real tracked affiliate URLs. Outbound clicks are
            recorded before redirecting.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge>{db.products.length} products</Badge>
          <Badge tone="dark">{sponsored} sponsored</Badge>
        </div>
      </div>

      <div className="mt-6 border border-ink/10 bg-cream p-4">
        <p className="text-[11px] leading-relaxed text-graphite">
          <span className="font-medium">How tracking works:</span> every “Buy now” link routes through{" "}
          <code className="text-[10px]">/go/&lt;product-id&gt;</code>, which logs the click and 307-redirects
          to the URL saved here. Sponsored products show a disclosure label automatically.
        </p>
      </div>

      <div className="mt-6">
        <AffiliateManager
          rows={db.products.map((product) => ({
            id: product.id,
            name: product.name,
            brand: product.brand,
            retailer: product.retailer,
            affiliateUrl: product.affiliateUrl,
            sponsored: product.sponsored,
            price: product.price,
            image: product.image,
          }))}
        />
      </div>
    </div>
  );
}
