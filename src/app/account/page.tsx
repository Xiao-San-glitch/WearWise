import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  Clock,
  Heart,
  LayoutDashboard,
  MessageCircle,
  Settings,
  Shield,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { getDb, getProducts } from "@/lib/db";
import { PreferencesForm, SignOutButton, WishlistSummary } from "@/components/account-forms";
import { AccountOutfits, type SavedOutfitView } from "@/components/account-outfits";
import { Eyebrow } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "My account" };

const TABS = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "preferences", label: "Preferences", icon: UserIcon },
  { key: "looks", label: "Saved looks", icon: Sparkles },
  { key: "wishlist", label: "Wishlist", icon: Heart },
  { key: "history", label: "AI & activity", icon: Clock },
  { key: "settings", label: "Settings", icon: Settings },
];

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { tab = "overview" } = await searchParams;

  const db = getDb();
  const products = getProducts();
  const productMap = new Map(products.map((product) => [product.id, product]));
  const rawOutfits = db.outfits.filter((outfit) => outfit.userId === user.id);
  const outfits: SavedOutfitView[] = rawOutfits.map((outfit) => ({
    id: outfit.id,
    title: outfit.title,
    total: outfit.total,
    explanation: outfit.explanation,
    createdAt: outfit.createdAt,
    items: outfit.productIds
      .map((id) => productMap.get(id))
      .filter((product): product is NonNullable<typeof product> => Boolean(product))
      .map((product) => ({
        id: product.id,
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        image: product.image,
        price: product.price,
      })),
  }));
  const history = db.aiHistory.filter((entry) => entry.userId === user.id).slice(0, 20);
  const clicks = db.clicks.filter((click) => click.userEmail === user.email).slice(0, 10);
  const memberSince = new Date(user.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const firstName = user.name.split(" ")[0];

  return (
    <div>
      <section className="border-b border-ink/10 bg-cream">
        <div className="container-ww py-10 sm:py-12">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <Eyebrow>My account</Eyebrow>
              <h1 className="display mt-3 text-[clamp(2rem,4vw,3.2rem)]">Hello, {firstName}.</h1>
              <p className="mt-2 text-sm text-smoke">
                {user.email} · Member since {memberSince}
              </p>
            </div>
            {user.role === "admin" && (
              <Link href="/admin" className="btn-secondary py-2.5 text-[10px]">
                <Shield className="h-3.5 w-3.5" /> Admin studio
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="container-ww py-9">
        <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside>
            <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
              {TABS.map((item) => {
                const Icon = item.icon;
                const active = tab === item.key;
                return (
                  <Link
                    key={item.key}
                    href={`/account?tab=${item.key}`}
                    className={`flex shrink-0 items-center gap-2.5 px-3 py-2.5 text-[11px] uppercase tracking-[0.12em] transition-colors ${
                      active ? "bg-ink text-cream" : "text-graphite hover:bg-cream"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" /> {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-6 border border-ink/10 bg-cream p-4">
              <p className="text-[10px] uppercase tracking-[0.14em] text-smoke">Stylist tip</p>
              <p className="mt-2 text-[11px] leading-relaxed text-graphite">
                Save your usual budget and fit preferences once — the stylist pre-fills every brief.
              </p>
              <Link href="/ai-stylist" className="mt-3 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em]">
                Style now <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="mt-4 border border-ink bg-ink p-4 text-cream">
              <p className="text-[10px] uppercase tracking-[0.14em] text-cream/60">Smart Closet</p>
              <p className="mt-2 text-[11px] leading-relaxed text-cream/85">
                Build outfits from the clothes you already own and see which purchase unlocks the most
                new looks.
              </p>
              <Link
                href="/closet"
                className="mt-3 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em]"
              >
                Open my closet <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </aside>

          <div className="min-w-0">
            {tab === "overview" && (
              <div className="space-y-8">
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { label: "Saved looks", value: outfits.length, href: "/account?tab=looks" },
                    { label: "AI requests", value: history.length, href: "/account?tab=history" },
                    { label: "Retailer visits", value: clicks.length, href: "/account?tab=history" },
                  ].map((stat) => (
                    <Link key={stat.label} href={stat.href} className="border border-ink/10 bg-cream p-5">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-smoke">{stat.label}</p>
                      <p className="mt-2 font-display text-3xl">{stat.value}</p>
                    </Link>
                  ))}
                </div>

                <div>
                  <h2 className="font-display text-2xl">Your style profile</h2>
                  <div className="mt-4 grid gap-3 border border-ink/10 p-5 sm:grid-cols-2">
                    {[
                      ["Shopping for", user.preferences.audience || "Not set"],
                      ["Usual budget", user.preferences.budget || "Not set"],
                      ["Occasion", user.preferences.occasion || "Not set"],
                      ["Style", user.preferences.style || "Not set"],
                      ["Colours", user.preferences.colors.join(", ") || "Not set"],
                      ["Fit", user.preferences.fit || "Not set"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-4 border-b border-ink/5 pb-2 text-sm">
                        <span className="text-smoke">{label}</span>
                        <span className="text-right capitalize">{value}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/account?tab=preferences" className="mt-4 inline-block text-[11px] uppercase tracking-[0.12em] underline underline-offset-2">
                    Edit preferences
                  </Link>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-2xl">Recent looks</h2>
                    <Link href="/account?tab=looks" className="text-[11px] uppercase tracking-[0.12em] text-smoke hover:text-ink">
                      View all
                    </Link>
                  </div>
                  <div className="mt-4">
                    <AccountOutfits outfits={outfits.slice(0, 2)} />
                  </div>
                </div>
              </div>
            )}

            {tab === "preferences" && (
              <div>
                <h2 className="font-display text-2xl">Fashion preferences</h2>
                <p className="mt-1 text-sm text-smoke">
                  These shape every AI brief and are used to pre-fill the stylist form.
                </p>
                <div className="mt-6">
                  <PreferencesForm initial={user.preferences} name={user.name} />
                </div>
              </div>
            )}

            {tab === "looks" && (
              <div>
                <h2 className="font-display text-2xl">Saved looks</h2>
                <p className="mt-1 text-sm text-smoke">
                  Looks saved while signed in are stored on your account and follow you across devices.
                </p>
                <div className="mt-6">
                  <AccountOutfits outfits={outfits} />
                </div>
              </div>
            )}

            {tab === "wishlist" && (
              <div>
                <h2 className="font-display text-2xl">Wishlist & saved looks</h2>
                <p className="mt-1 text-sm text-smoke">
                  Products and looks saved in this browser. Open the wishlist for the full view.
                </p>
                <div className="mt-6">
                  <WishlistSummary />
                </div>
                <div className="mt-6 flex gap-3">
                  <Link href="/wishlist" className="btn-primary py-2.5 text-[10px]">
                    <Heart className="h-3.5 w-3.5" /> Open wishlist
                  </Link>
                  <Link href="/shop" className="btn-secondary py-2.5 text-[10px]">Browse products</Link>
                </div>
              </div>
            )}

            {tab === "history" && (
              <div className="space-y-8">
                <div>
                  <h2 className="font-display text-2xl">AI stylist history</h2>
                  <p className="mt-1 text-sm text-smoke">Your last 20 requests, newest first.</p>
                  {history.length ? (
                    <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
                      {history.map((entry) => (
                        <li key={entry.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                          <span className="flex items-center gap-2.5">
                            {entry.kind === "chat" ? (
                              <MessageCircle className="h-3.5 w-3.5 text-smoke" />
                            ) : (
                              <Sparkles className="h-3.5 w-3.5 text-smoke" />
                            )}
                            {entry.prompt}
                          </span>
                          <span className="text-[10px] uppercase tracking-[0.12em] text-stone">
                            {entry.source} · {new Date(entry.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 border border-dashed border-ink/15 p-6 text-sm text-smoke">
                      No stylist requests yet.{" "}
                      <Link href="/ai-stylist" className="underline underline-offset-2">Build your first look</Link>.
                    </p>
                  )}
                </div>

                <div>
                  <h2 className="font-display text-2xl">Retailer activity</h2>
                  <p className="mt-1 text-sm text-smoke">
                    Links you opened recently. WearWise doesn&apos;t process orders, so purchase
                    history lives with each retailer.
                  </p>
                  {clicks.length ? (
                    <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
                      {clicks.map((click) => (
                        <li key={click.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                          <span>{click.productName}</span>
                          <span className="flex items-center gap-3 text-[10px] uppercase tracking-[0.1em] text-stone">
                            {new Date(click.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            <Link href={`/go/${click.productId}?source=account`} target="_blank" rel="noopener noreferrer">
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </Link>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 border border-dashed border-ink/15 p-6 text-sm text-smoke">
                      No retailer visits yet.
                    </p>
                  )}
                </div>
              </div>
            )}

            {tab === "settings" && (
              <div className="max-w-xl">
                <h2 className="font-display text-2xl">Account settings</h2>
                <div className="mt-6 space-y-4">
                  <div className="border border-ink/10 p-5">
                    <p className="field-label">Name</p>
                    <p className="text-sm">{user.name}</p>
                    <p className="field-label mt-4">Email</p>
                    <p className="text-sm">{user.email}</p>
                    <p className="field-label mt-4">Role</p>
                    <p className="text-sm capitalize">{user.role}</p>
                    <Link href="/account?tab=preferences" className="mt-4 inline-block text-[11px] uppercase tracking-[0.12em] underline underline-offset-2">
                      Edit name & preferences
                    </Link>
                  </div>
                  <div className="border border-ink/10 p-5">
                    <p className="text-sm font-medium">Session</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-smoke">
                      Signing out clears this browser session. Your saved looks and preferences stay
                      on your account.
                    </p>
                    <div className="mt-4">
                      <SignOutButton />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
