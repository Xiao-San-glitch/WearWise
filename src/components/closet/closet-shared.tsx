"use client";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/format";

export function ScoreBar({
  score,
  label = "Versatility score",
  tone = "dark",
}: {
  score: number;
  label?: string;
  tone?: "dark" | "light";
}) {
  const safe = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span
          className={cn(
            "text-[10px] uppercase tracking-[0.14em]",
            tone === "light" ? "text-cream/70" : "text-smoke",
          )}
        >
          {label}
        </span>
        <span className={cn("text-xs font-medium tabular", tone === "light" ? "text-cream" : "text-ink")}>
          {safe}/100
        </span>
      </div>
      <div
        className={cn(
          "mt-1.5 h-1.5 w-full overflow-hidden rounded-full",
          tone === "light" ? "bg-cream/20" : "bg-ink/10",
        )}
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={safe}
        aria-label={label}
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-700", tone === "light" ? "bg-cream" : "bg-ink")}
          style={{ width: `${safe}%` }}
        />
      </div>
    </div>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border border-ink/10 bg-paper p-5 sm:p-6", className)}>
      {(title || action) && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="font-display text-xl">{title}</h2>}
            {description && <p className="mt-1 text-[12px] leading-relaxed text-smoke">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatusNote({
  kind,
  children,
}: {
  kind: "error" | "success" | "info";
  children: ReactNode;
}) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    info: "border-ink/10 bg-cream text-graphite",
  };
  return (
    <p className={cn("flex items-start gap-2 border px-3.5 py-3 text-[12px] leading-relaxed", styles[kind])}>
      {kind === "error" ? (
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      ) : kind === "success" ? (
        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      ) : null}
      <span>{children}</span>
    </p>
  );
}

export function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 border border-dashed border-ink/15 bg-cream/40 text-sm text-smoke">
      <Loader2 className="h-5 w-5 animate-spin" />
      {label}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-3.5 w-3.5 animate-spin", className)} />;
}

export const COLOR_HEX: Record<string, string> = {
  Black: "#14110F",
  White: "#FFFFFF",
  Cream: "#F7F3EC",
  Beige: "#E6DFD4",
  Grey: "#9C978F",
  Navy: "#1F2A44",
  Blue: "#3B5B8C",
  Indigo: "#3B3F6B",
  Olive: "#6B6B4A",
  Wine: "#5C2B36",
  Tan: "#C8A27A",
  Red: "#A33A32",
  Green: "#3F6B4F",
  Pink: "#D8A7A7",
  Orange: "#C87A3E",
  Brown: "#6B4B36",
  Multicolour: "#B9AEA0",
};

export function isoDate(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function upcomingDays(count = 7): { iso: string; label: string; day: string }[] {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return {
      iso: isoDate(date),
      label: date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
      day: index === 0 ? "Today" : index === 1 ? "Tomorrow" : date.toLocaleDateString("en-IN", { weekday: "long" }),
    };
  });
}
