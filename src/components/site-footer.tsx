import Link from "next/link";
import { Instagram, Linkedin, Twitter } from "lucide-react";
import { NewsletterForm } from "./newsletter-form";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { label: "Women's Fashion", href: "/women" },
      { label: "Men's Fashion", href: "/men" },
      { label: "Streetwear", href: "/streetwear" },
      { label: "New In", href: "/new-in" },
      { label: "Shop All", href: "/shop" },
    ],
  },
  {
    title: "Experience",
    links: [
      { label: "AI Stylist", href: "/ai-stylist" },
      { label: "AI Assistant", href: "/ai-stylist/assistant" },
      { label: "Smart Closet", href: "/closet" },
      { label: "Saved Outfits", href: "/wishlist" },
      { label: "My Account", href: "/account" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Affiliate Disclosure", href: "/affiliate-disclosure" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-ink/10 bg-paper">
      <div className="container-ww py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div className="max-w-sm">
            <Link href="/" className="flex items-baseline gap-1.5">
              <span className="font-display text-[26px]">WearWise</span>
              <span className="rounded-sm bg-ink px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] text-cream">
                AI
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-smoke">
              Your style. Your budget. Your AI stylist. WearWise AI turns your preferences into
              complete outfits from real Indian labels.
            </p>
            <div className="mt-8">
              <p className="eyebrow mb-3">The WearWise Edit</p>
              <NewsletterForm />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <p className="eyebrow mb-4">{column.title}</p>
                <ul className="space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-graphite transition-colors hover:text-ink"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-6 border-t border-ink/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-stone">
            © {new Date().getFullYear()} WearWise AI. A fashion discovery project. Prices and
            availability are indicative.
          </p>
          <div className="flex items-center gap-1">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="btn-icon"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
              className="btn-icon"
            >
              <Twitter className="h-4 w-4" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="btn-icon"
            >
              <Linkedin className="h-4 w-4" />
            </a>
          </div>
        </div>

        <p className="mt-6 text-[10px] leading-relaxed text-stone">
          WearWise AI is an affiliate fashion discovery platform. We may earn a commission when you
          shop through links on this site, at no extra cost to you. We do not process payments or
          fulfil orders — checkout happens on the partner retailer&apos;s website.{" "}
          <Link href="/affiliate-disclosure" className="underline underline-offset-2">
            Read the full disclosure
          </Link>
          .
        </p>
      </div>
    </footer>
  );
}
