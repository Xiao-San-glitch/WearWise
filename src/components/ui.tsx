import Link from "next/link";
import { Star } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/format";

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("eyebrow", className)}>{children}</p>;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  action?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "sm:flex-col sm:items-center sm:text-center",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}
        <h2 className="display text-[clamp(1.75rem,3.4vw,2.9rem)] text-balance">{title}</h2>
        {description && <p className="mt-3 max-w-xl text-sm leading-relaxed text-smoke">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "dark" | "sale" | "sponsored" | "success";
  className?: string;
}) {
  const tones = {
    neutral: "border-ink/15 text-graphite",
    dark: "border-ink bg-ink text-cream",
    sale: "border-clay/30 bg-clay/10 text-clay",
    sponsored: "border-ink/15 bg-cream text-smoke",
    success: "border-emerald-700/20 bg-emerald-50 text-emerald-800",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Rating({ rating, reviews, compact }: { rating: number; reviews?: number; compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-smoke">
      <Star className="h-3 w-3 fill-ink text-ink" aria-hidden />
      <span className="font-medium text-ink">{rating.toFixed(1)}</span>
      {!compact && reviews !== undefined && <span>({reviews})</span>}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-ink/15 bg-cream/40 px-6 py-20 text-center">
      {icon && <div className="mb-5 text-stone">{icon}</div>}
      <h3 className="font-display text-2xl">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-smoke">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function TextLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-ink",
        className,
      )}
    >
      <span className="link-underline">{children}</span>
      <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">→</span>
    </Link>
  );
}
