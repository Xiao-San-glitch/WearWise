import Link from "next/link";
import { getDb } from "@/lib/db";
import { inr } from "@/lib/format";

export const dynamic = "force-dynamic";

const CONVERSION = 0.018;
const COMMISSION = 0.08;

export default function AdminAnalyticsPage() {
  const db = getDb();
  const clicks = db.clicks;

  const days = Array.from({ length: 14 }).map((_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (13 - index));
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    const count = clicks.filter((click) => {
      const time = new Date(click.createdAt).getTime();
      return time >= date.getTime() && time < next.getTime();
    }).length;
    return {
      label: date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      count,
    };
  });
  const maxDay = Math.max(1, ...days.map((day) => day.count));

  const bySource = new Map<string, number>();
  for (const click of clicks) {
    bySource.set(click.source, (bySource.get(click.source) ?? 0) + 1);
  }

  const byProduct = new Map<string, number>();
  for (const click of clicks) {
    byProduct.set(click.productId, (byProduct.get(click.productId) ?? 0) + 1);
  }
  const topProducts = [...byProduct.entries()]
    .map(([id, count]) => ({ product: db.products.find((item) => item.id === id), count }))
    .filter((entry) => entry.product)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const byCategory = new Map<string, number>();
  for (const [id, count] of byProduct.entries()) {
    const product = db.products.find((item) => item.id === id);
    if (!product) continue;
    byCategory.set(product.category, (byCategory.get(product.category) ?? 0) + count);
  }
  const categories = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
  const totalClicks = clicks.length;
  const revenue = totalClicks * CONVERSION * COMMISSION * 2000;
  const aiChats = db.aiHistory.filter((entry) => entry.kind === "chat").length;
  const aiLooks = db.aiHistory.filter((entry) => entry.kind === "stylist").length;

  const stats = [
    { label: "Outbound clicks", value: totalClicks },
    { label: "Stylist sessions", value: aiLooks },
    { label: "Assistant questions", value: aiChats },
    { label: "Saved outfits", value: db.outfits.length },
    { label: "Est. commission", value: inr(Math.round(revenue)) },
    { label: "Newsletter", value: db.newsletter.length },
  ];

  return (
    <div>
      <p className="eyebrow">Reporting</p>
      <h1 className="display mt-2 text-[clamp(1.8rem,3.2vw,2.6rem)]">Affiliate analytics</h1>
      <p className="mt-1 text-sm text-smoke">
        Click-level reporting from this store's own database. Figures are indicative — no order data
        is received from retailers.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <div key={stat.label} className="border border-ink/10 bg-cream p-4">
            <p className="text-[9px] uppercase tracking-[0.12em] text-smoke">{stat.label}</p>
            <p className="mt-2 font-display text-2xl tabular">{stat.value}</p>
          </div>
        ))}
      </div>

      <section className="mt-8 border border-ink/10 p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl">Clicks · last 14 days</h2>
          <p className="text-[10px] uppercase tracking-[0.12em] text-stone">
            Peak {maxDay} / day
          </p>
        </div>
        <div className="mt-6 flex h-40 items-end gap-1.5">
          {days.map((day) => (
            <div key={day.label} className="group flex flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[9px] text-stone opacity-0 transition-opacity group-hover:opacity-100">
                {day.count}
              </span>
              <div
                className="w-full bg-ink/80 transition-colors group-hover:bg-ink"
                style={{ height: `${Math.max(3, (day.count / maxDay) * 130)}px` }}
              />
              <span className="whitespace-nowrap text-[8px] uppercase tracking-[0.06em] text-stone">
                {day.label.split(" ")[0]}
              </span>
            </div>
          ))}
        </div>
        {totalClicks === 0 && (
          <p className="mt-4 text-[11px] text-smoke">
            No clicks yet. Open a product and press “Buy now” to generate tracking data.
          </p>
        )}
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-xl">Top clicked products</h2>
          {topProducts.length ? (
            <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
              {topProducts.map(({ product, count }) => (
                <li key={product!.id} className="flex items-center gap-3 py-3">
                  <img src={product!.image} alt="" className="h-12 w-9 object-cover" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/product/${product!.slug}`} className="truncate text-sm hover:underline">
                      {product!.name}
                    </Link>
                    <p className="text-[10px] uppercase tracking-[0.1em] text-stone">
                      {product!.brand} · {product!.retailer}
                    </p>
                  </div>
                  <span className="text-sm tabular">{count}</span>
                  <span className="w-14 text-right text-[10px] text-stone">
                    {inr(product!.price)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 border border-dashed border-ink/15 p-6 text-sm text-smoke">No data yet.</p>
          )}
        </section>

        <div className="space-y-8">
          <section>
            <h2 className="font-display text-xl">Traffic sources</h2>
            <ul className="mt-4 space-y-2">
              {[...bySource.entries()].sort((a, b) => b[1] - a[1]).map(([source, count]) => (
                <li key={source}>
                  <div className="flex justify-between text-[11px]">
                    <span className="uppercase tracking-[0.1em] text-graphite">{source}</span>
                    <span className="tabular">{count}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full bg-ink/10">
                    <div className="h-full bg-ink" style={{ width: `${(count / Math.max(1, totalClicks)) * 100}%` }} />
                  </div>
                </li>
              ))}
              {!bySource.size && <p className="text-sm text-smoke">No data yet.</p>}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl">Clicks by category</h2>
            <ul className="mt-4 space-y-2">
              {categories.map(([category, count]) => (
                <li key={category}>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-graphite">{category}</span>
                    <span className="tabular">{count}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full bg-ink/10">
                    <div className="h-full bg-clay" style={{ width: `${(count / Math.max(1, totalClicks)) * 100}%` }} />
                  </div>
                </li>
              ))}
              {!categories.length && <p className="text-sm text-smoke">No data yet.</p>}
            </ul>
          </section>
        </div>
      </div>

      <section className="mt-8 border border-ink/10 bg-cream p-5">
        <h2 className="font-display text-xl">Revenue estimate methodology</h2>
        <dl className="mt-3 grid gap-3 text-[11px] sm:grid-cols-2">
          <div className="flex justify-between border-b border-ink/10 pb-2">
            <dt className="text-smoke">Assumed conversion</dt>
            <dd>{(CONVERSION * 100).toFixed(1)}%</dd>
          </div>
          <div className="flex justify-between border-b border-ink/10 pb-2">
            <dt className="text-smoke">Assumed commission</dt>
            <dd>{(COMMISSION * 100).toFixed(0)}%</dd>
          </div>
          <div className="flex justify-between border-b border-ink/10 pb-2">
            <dt className="text-smoke">Assumed order value</dt>
            <dd>{inr(2000)}</dd>
          </div>
          <div className="flex justify-between border-b border-ink/10 pb-2">
            <dt className="text-smoke">Estimated commission</dt>
            <dd>{inr(Math.round(revenue))}</dd>
          </div>
        </dl>
        <p className="mt-3 text-[10px] leading-relaxed text-stone">
          These are planning assumptions, not reported sales. WearWise never records a purchase — only
          an outbound click. Replace the assumptions with partner-reported data when available.
        </p>
      </section>
    </div>
  );
}
