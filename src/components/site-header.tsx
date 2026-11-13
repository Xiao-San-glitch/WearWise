"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Shield,
  Shirt,
  ShoppingBag,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useStore } from "./store-provider";
import { cn, inr } from "@/lib/format";
import type { PublicUser } from "@/lib/auth";

const NAV = [
  { label: "Women", href: "/women" },
  { label: "Men", href: "/men" },
  { label: "Streetwear", href: "/streetwear" },
  { label: "Shop All", href: "/shop" },
  { label: "AI Stylist", href: "/ai-stylist" },
  { label: "Closet", href: "/closet" },
];

const POPULAR = [
  "Black oversized t-shirt under ₹1,000",
  "Minimalist office outfit",
  "Wedding guest saree",
  "White sneakers",
];

interface Suggestion {
  slug: string;
  name: string;
  brand: string;
  price: number;
  image: string;
}

export function SiteHeader({ user }: { user: PublicUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const { cartCount, wishlist, hydrated } = useStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearchOpen(false);
    setMenuOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (searchOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(timer);
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!term.trim()) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search/suggest?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = (await response.json()) as { products?: Suggestion[] };
        setSuggestions(data.products ?? []);
      } catch {
        /* aborted */
      }
    }, 180);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [term]);

  useEffect(() => {
    document.body.style.overflow = menuOpen || searchOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, searchOpen]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setAccountOpen(false);
    router.push("/");
    router.refresh();
  }

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    if (!term.trim()) return;
    setSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(term.trim())}`);
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <div className="bg-ink text-cream">
        <div className="container-ww flex h-9 items-center justify-between text-[10px] uppercase tracking-[0.18em]">
          <span className="hidden sm:inline">AI-styled outfits · 48k looks generated</span>
          <span className="flex items-center gap-2">
            <Sparkles className="h-3 w-3" />
            Free personal styling, always
          </span>
          <span className="hidden sm:inline">Ships across India</span>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-ink/10 bg-paper/95 backdrop-blur-md">
        <div className="container-ww flex h-[72px] items-center justify-between gap-4">
          <button
            className="btn-icon -ml-2 lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/" aria-label="WearWise AI home" className="group flex shrink-0 items-center rounded-md bg-ink/90 px-3 py-1.5">
            <Image src="/wearwise-ai-logo.png" alt="WearWise AI" width={520} height={174} priority className="h-auto w-[140px] sm:w-[170px] lg:w-[200px]" />
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative text-[11px] font-medium uppercase tracking-[0.16em] text-graphite transition-colors hover:text-ink",
                  isActive(item.href) && "text-ink",
                  item.href === "/ai-stylist" && "flex items-center gap-1.5",
                )}
              >
                {item.href === "/ai-stylist" && <Sparkles className="h-3.5 w-3.5" />}
                {item.label}
                {isActive(item.href) && (
                  <span className="absolute -bottom-[26px] left-0 right-0 h-px bg-ink" />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-0.5 sm:gap-1">
            <button
              className="btn-icon"
              aria-label="Search"
              onClick={() => setSearchOpen((open) => !open)}
            >
              <Search className="h-[18px] w-[18px]" />
            </button>

            <Link href="/wishlist" className="btn-icon" aria-label="Wishlist">
              <Heart className="h-[18px] w-[18px]" />
              {hydrated && wishlist.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[9px] font-medium text-cream">
                  {wishlist.length}
                </span>
              )}
            </Link>

            <div className="relative hidden sm:block">
              <button
                className="btn-icon"
                aria-label="Account"
                onClick={() => setAccountOpen((open) => !open)}
              >
                <User className="h-[18px] w-[18px]" />
              </button>
              {accountOpen && (
                <>
                  <button
                    className="fixed inset-0 z-10 cursor-default"
                    aria-label="Close account menu"
                    onClick={() => setAccountOpen(false)}
                  />
                  <div className="absolute right-0 top-12 z-20 w-60 border border-ink/10 bg-paper p-2 shadow-lift">
                    {user ? (
                      <>
                        <div className="border-b border-ink/10 px-3 pb-3 pt-2">
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="mt-0.5 truncate text-xs text-smoke">{user.email}</p>
                        </div>
                        <Link
                          href="/account"
                          className="mt-2 flex items-center gap-2.5 px-3 py-2.5 text-xs text-graphite hover:bg-cream"
                        >
                          <LayoutDashboard className="h-4 w-4" /> Dashboard
                        </Link>
                        <Link
                          href="/closet"
                          className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-graphite hover:bg-cream"
                        >
                          <Shirt className="h-4 w-4" /> Smart Closet
                        </Link>
                        <Link
                          href="/account?tab=looks"
                          className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-graphite hover:bg-cream"
                        >
                          <Sparkles className="h-4 w-4" /> Saved looks
                        </Link>
                        {user.role === "admin" && (
                          <Link
                            href="/admin"
                            className="flex items-center gap-2.5 px-3 py-2.5 text-xs text-graphite hover:bg-cream"
                          >
                            <Shield className="h-4 w-4" /> Admin studio
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-xs text-graphite hover:bg-cream"
                        >
                          <LogOut className="h-4 w-4" /> Sign out
                        </button>
                      </>
                    ) : (
                      <div className="p-3">
                        <p className="text-sm font-medium">Welcome to WearWise</p>
                        <p className="mt-1 text-xs leading-relaxed text-smoke">
                          Sign in to save looks and keep your stylist history.
                        </p>
                        <Link href="/login" className="btn-primary mt-4 w-full py-2.5 text-[11px]">
                          Sign in
                        </Link>
                        <Link
                          href="/signup"
                          className="mt-2 block text-center text-[11px] uppercase tracking-[0.14em] text-smoke hover:text-ink"
                        >
                          Create account
                        </Link>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <Link href="/cart" className="btn-icon" aria-label="Shopping bag">
              <ShoppingBag className="h-[18px] w-[18px]" />
              {hydrated && cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[9px] font-medium text-cream">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-ink/10 bg-paper">
            <div className="container-ww py-6">
              <form onSubmit={submitSearch} className="flex items-center gap-3 border-b border-ink pb-3">
                <Search className="h-5 w-5 text-stone" />
                <input
                  ref={inputRef}
                  value={term}
                  onChange={(event) => setTerm(event.target.value)}
                  placeholder="Try &ldquo;black oversized t-shirt under ₹1,000&rdquo;"
                  className="w-full bg-transparent text-base outline-none placeholder:text-stone sm:text-lg"
                  aria-label="Search products"
                />
                <button type="button" onClick={() => setSearchOpen(false)} aria-label="Close search">
                  <X className="h-5 w-5 text-smoke" />
                </button>
              </form>

              {term.trim() ? (
                <div className="mt-5">
                  {suggestions.length > 0 ? (
                    <div className="grid gap-1">
                      {suggestions.map((item) => (
                        <Link
                          key={item.slug}
                          href={`/product/${item.slug}`}
                          className="flex items-center gap-4 rounded-sm p-2 transition-colors hover:bg-cream"
                        >
                          <img
                            src={item.image}
                            alt=""
                            className="h-14 w-11 object-cover"
                            loading="lazy"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm">{item.name}</p>
                            <p className="text-[11px] uppercase tracking-[0.12em] text-smoke">
                              {item.brand} · {inr(item.price)}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-stone" />
                        </Link>
                      ))}
                      <button
                        onClick={() =>
                          router.push(`/search?q=${encodeURIComponent(term.trim())}`)
                        }
                        className="mt-2 flex items-center gap-2 self-start text-[11px] uppercase tracking-[0.16em] text-ink"
                      >
                        View all results <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-smoke">
                      Press enter to search the full catalogue for &ldquo;{term}&rdquo;.
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-5">
                  <p className="eyebrow mb-3">Popular searches</p>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR.map((item) => (
                      <button
                        key={item}
                        onClick={() => router.push(`/search?q=${encodeURIComponent(item)}`)}
                        className="chip"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-paper p-6 shadow-lift">
            <div className="flex items-center justify-between">
              <div className="flex items-center rounded-md bg-ink/90 px-3 py-1.5">
                <Image src="/wearwise-ai-logo.png" alt="WearWise AI" width={520} height={174} className="h-auto w-[160px]" />
              </div>
              <button className="btn-icon" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-8 flex flex-col">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="border-b border-ink/10 py-4 font-display text-2xl"
                >
                  {item.label}
                </Link>
              ))}
              <Link href="/closet" className="flex items-center gap-2 border-b border-ink/10 py-4 font-display text-2xl">
                Smart Closet <Shirt className="h-4 w-4 text-smoke" />
              </Link>
              <Link href="/new-in" className="border-b border-ink/10 py-4 font-display text-2xl">
                New In
              </Link>
              <Link href="/wishlist" className="border-b border-ink/10 py-4 font-display text-2xl">
                Wishlist
              </Link>
              <Link href="/account" className="border-b border-ink/10 py-4 font-display text-2xl">
                Account
              </Link>
            </nav>
            <div className="mt-auto pt-8">
              {user ? (
                <button onClick={handleLogout} className="btn-secondary w-full">
                  Sign out
                </button>
              ) : (
                <div className="grid gap-2">
                  <Link href="/login" className="btn-primary w-full">
                    Sign in
                  </Link>
                  <Link href="/signup" className="btn-secondary w-full">
                    Create account
                  </Link>
                </div>
              )}
              <Link href="/ai-stylist" className="mt-4 flex items-center justify-between bg-cream p-4">
                <span className="text-xs uppercase tracking-[0.16em]">Get styled in 30 seconds</span>
                <Sparkles className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
