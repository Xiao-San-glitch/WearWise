import Link from "next/link";
import { ArrowUpRight, Banknote, MousePointerClick, Sparkles, Users } from "lucide-react";
import { getDb } from "@/lib/db";
import { inr } from "@/lib/format";
import { Badge } from "@/components/ui";

export const dynamic = "force-dynamic";

const CONVERSION = 0.018;
const COMMISSION = 0.08;

export default function AdminOverviewPage() {
  const db = getDb();
  const avgPrice = db.products.reduce((sum, product) => sum + product.price, 0) / (db.products.length || 1);
  const clicks = db.clicks.length;
  const revenue = clicks * CONVERSION * COMMISSION * avgPrice;

  const clickCounts = new Map<string, number>();
  for (const click of db.clicks) {
    clickCounts.set(click.productId, (clickCounts.get(click.productId) ?? 0) + 1);
  }
  const topProducts = [...clickCounts.entries()]
    .map(([id, count]) => ({ product: db.products.find((item) => item.id === id), count }))
    .filter((entry) => entry.product)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const stats = [
    { label: "Products live", value: db.products.length, icon: Sparkles, href: "/admin/products" },
    { label: "Registered users", value: db.users.length, icon: Users, href: "/admin/users" },
    { label: "Affiliate clicks", value: clicks, icon: MousePointerClick, href: "/admin/analytics" },
    { label: "Est. commission", value: inr(Math.round(revenue)), icon: Banknote, href: "/admin/analytics" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Admin overview</p>
          <h1 className="display mt-2 text-[clamp(1.9rem,3.4vw,2.8rem)]">Studio dashboard</h1>
        </div>
        <Link href="/admin/products/new" className="btn-primary py-2.5 text-[10px]">
          Add product
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href} className="border border-ink/10 bg-cream p-5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.14em] text-smoke">{stat.label}</p>
                <Icon className="h-4 w-4 text-stone" />
              </div>
              <p className="mt-3 font-display text-3xl tabular">{stat.value}</p>
            </Link>
          );
        })}
      </div>

      <div className="mt-4 border border-ink/15 bg-paper p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-smoke">Revenue estimate</p>
            <p className="mt-1 text-[11px] text-smoke">
              {clicks} clicks × {CONVERSION * 100}% conversion × {COMMISSION * 100}% commission ×{" "}
              {inr(Math.round(avgPrice))} average order value
            </p>
          </div>
          <p className="font-display text-2xl">{inr(Math.round(revenue))}</p>
        </div>
        <p className="mt-3 text-[10px] text-stone">
          Indicative only — WearWise records outbound clicks, not confirmed sales. Real commission
          depends on partner reporting.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl">Most clicked products</h2>
            <Link href="/admin/analytics" className="text-[10px] uppercase tracking-[0.12em] text-smoke hover:text-ink">
              Full report
            </Link>
          </div>
          {topProducts.length ? (
            <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
              {topProducts.map(({ product, count }) => (
                <li key={product!.id} className="flex items-center gap-3 py-3">
                  <img src={product!.image} alt="" className="h-12 w-9 object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{product!.name}</p>
                    <p className="text-[10px] uppercase tracking-[0.1em] text-stone">
                      {product!.brand} · {inr(product!.price)}
                    </p>
                  </div>
                  <span className="text-sm tabular">{count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 border border-dashed border-ink/15 p-6 text-sm text-smoke">
              No outbound clicks recorded yet. Open a product and use “Buy now” to test tracking.
            </p>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl">Recent AI requests</h2>
            <Badge>{db.aiHistory.length} total</Badge>
          </div>
          {db.aiHistory.length ? (
            <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
              {db.aiHistory.slice(0, 8).map((entry) => {
                const user = db.users.find((candidate) => candidate.id === entry.userId);
                return (
                  <li key={entry.id} className="py-3">
                    <p className="truncate text-sm">{entry.prompt}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-[0.1em] text-stone">
                      {entry.kind} · {entry.source} · {user?.email ?? "guest"}
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 border border-dashed border-ink/15 p-6 text-sm text-smoke">
              No AI requests yet.
            </p>
          )}
        </section>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-xl">Newest users</h2>
          <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
            {db.users.slice(-5).reverse().map((user) => (
              <li key={user.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span>
                  {user.name}
                  <span className="ml-2 text-[10px] uppercase tracking-[0.1em] text-stone">{user.role}</span>
                </span>
                <span className="text-[11px] text-smoke">{user.email}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl">Inbox</h2>
          {db.contacts.length ? (
            <ul className="mt-4 space-y-3">
              {db.contacts.slice(0, 3).map((message) => (
                <li key={message.id} className="border border-ink/10 p-4">
                  <div className="flex justify-between gap-3">
                    <p className="text-sm font-medium">{message.subject}</p>
                    <span className="text-[10px] text-stone">
                      {new Date(message.createdAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-smoke">
                    {message.name} · {message.email}
                  </p>
                  <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-graphite">
                    {message.message}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 border border-dashed border-ink/15 p-6 text-sm text-smoke">
              No contact messages yet. Try the{" "}
              <Link href="/contact" className="underline underline-offset-2">contact form</Link>.
            </p>
          )}
        </section>
      </div>

      <div className="mt-10 flex flex-wrap gap-3 border-t border-ink/10 pt-6">
        <Link href="/admin/products/new" className="btn-secondary py-2.5 text-[10px]">
          Add a product <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
        <Link href="/admin/affiliate" className="btn-secondary py-2.5 text-[10px]">
          Manage affiliate links
        </Link>
      </div>
    </div>
  );
}
