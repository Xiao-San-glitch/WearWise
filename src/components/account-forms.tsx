"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Heart, Loader2, LogOut, Sparkles } from "lucide-react";
import type { UserPreferences } from "@/lib/types";
import { useStore } from "./store-provider";
import { cn } from "@/lib/format";

const AUDIENCES = ["men", "women", "unisex"];
const BUDGETS = [
  { value: "500-1000", label: "₹500 – ₹1,000" },
  { value: "1000-2000", label: "₹1,000 – ₹2,000" },
  { value: "2000-5000", label: "₹2,000 – ₹5,000" },
  { value: "5000+", label: "₹5,000+" },
];
const OCCASIONS = ["College", "Casual", "Party", "Wedding", "Office", "Date", "Travel"];
const STYLES = ["Streetwear", "Minimalist", "Old Money", "Casual", "Formal", "Sporty", "Traditional", "Aesthetic"];
const SEASONS = ["Summer", "Monsoon", "Winter", "All-season"];
const COLORS = ["Black", "White", "Cream", "Beige", "Grey", "Navy", "Blue", "Indigo", "Olive", "Wine", "Tan"];
const FITS = ["slim", "regular", "oversized"];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "border px-3 py-2 text-[11px] uppercase tracking-[0.1em] transition-colors",
        active ? "border-ink bg-ink text-cream" : "border-ink/20 text-graphite hover:border-ink",
      )}
    >
      {children}
    </button>
  );
}

export function PreferencesForm({
  initial,
  name: initialName,
}: {
  initial: UserPreferences;
  name: string;
}) {
  const router = useRouter();
  const [prefs, setPrefs] = useState<UserPreferences>(initial);
  const [name, setName] = useState(initialName);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  function toggleColor(color: string) {
    setPrefs((prev) => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter((item) => item !== color)
        : [...prev.colors, color],
    }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setStatus("saving");
    try {
      const response = await fetch("/api/account/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, preferences: prefs }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setStatus("error");
        setMessage(data.error ?? "Couldn't save your preferences.");
        return;
      }
      setStatus("saved");
      setMessage("Preferences saved.");
      router.refresh();
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <form onSubmit={save} className="space-y-8">
      {status === "error" && (
        <p className="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{message}</p>
      )}
      {status === "saved" && (
        <p className="flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          <Check className="h-3.5 w-3.5" /> {message}
        </p>
      )}

      <div>
        <label className="field-label">Display name</label>
        <input value={name} onChange={(event) => setName(event.target.value)} className="input max-w-sm" />
      </div>

      <div>
        <p className="field-label">I usually shop for</p>
        <div className="flex flex-wrap gap-2">
          {AUDIENCES.map((audience) => (
            <Chip
              key={audience}
              active={prefs.audience === audience}
              onClick={() =>
                setPrefs((prev) => ({
                  ...prev,
                  audience: (prev.audience === audience ? "" : audience) as UserPreferences["audience"],
                }))
              }
            >
              {audience}
            </Chip>
          ))}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="field-label">Typical budget</p>
          <select
            value={prefs.budget}
            onChange={(event) => setPrefs((prev) => ({ ...prev, budget: event.target.value }))}
            className="input"
          >
            <option value="">No preference</option>
            {BUDGETS.map((budget) => (
              <option key={budget.value} value={budget.value}>{budget.label}</option>
            ))}
          </select>
        </div>
        <div>
          <p className="field-label">Favourite season</p>
          <select
            value={prefs.season}
            onChange={(event) => setPrefs((prev) => ({ ...prev, season: event.target.value }))}
            className="input"
          >
            <option value="">No preference</option>
            {SEASONS.map((season) => (
              <option key={season} value={season}>{season}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="field-label">Usual occasion</p>
          <div className="flex flex-wrap gap-1.5">
            {OCCASIONS.map((occasion) => (
              <Chip
                key={occasion}
                active={prefs.occasion === occasion}
                onClick={() => setPrefs((prev) => ({ ...prev, occasion: prev.occasion === occasion ? "" : occasion }))}
              >
                {occasion}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <p className="field-label">Style</p>
          <div className="flex flex-wrap gap-1.5">
            {STYLES.map((style) => (
              <Chip
                key={style}
                active={prefs.style === style}
                onClick={() => setPrefs((prev) => ({ ...prev, style: prev.style === style ? "" : style }))}
              >
                {style}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <div>
        <p className="field-label">Preferred colours</p>
        <div className="flex flex-wrap gap-1.5">
          {COLORS.map((color) => (
            <Chip key={color} active={prefs.colors.includes(color)} onClick={() => toggleColor(color)}>
              {color}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <p className="field-label">Fit preference</p>
        <div className="flex flex-wrap gap-1.5">
          {FITS.map((fit) => (
            <Chip
              key={fit}
              active={prefs.fit === fit}
              onClick={() =>
                setPrefs((prev) => ({ ...prev, fit: (prev.fit === fit ? "" : fit) as UserPreferences["fit"] }))
              }
            >
              {fit}
            </Chip>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-ink/10 pt-6">
        <button type="submit" className="btn-primary" disabled={status === "saving"}>
          {status === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save preferences"}
        </button>
        <Link href="/ai-stylist" className="btn-secondary">
          <Sparkles className="h-3.5 w-3.5" /> Style with these
        </Link>
      </div>
    </form>
  );
}

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <button
      onClick={async () => {
        setLoading(true);
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
      className="btn-secondary"
      disabled={loading}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />} Sign out
    </button>
  );
}

export function WishlistSummary() {
  const { wishlist, looks, hydrated } = useStore();

  if (!hydrated) return <p className="text-sm text-smoke">Loading…</p>;

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="border border-ink/10 bg-cream p-5">
        <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-smoke">
          <Heart className="h-3.5 w-3.5" /> Wishlist
        </p>
        <p className="mt-2 font-display text-3xl">{wishlist.length}</p>
        <p className="mt-1 text-[11px] text-smoke">products saved on this device</p>
        <Link href="/wishlist" className="mt-4 inline-block text-[11px] uppercase tracking-[0.12em] underline underline-offset-2">
          Open wishlist
        </Link>
      </div>
      <div className="border border-ink/10 bg-cream p-5">
        <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-smoke">
          <Sparkles className="h-3.5 w-3.5" /> Saved looks
        </p>
        <p className="mt-2 font-display text-3xl">{looks.length}</p>
        <p className="mt-1 text-[11px] text-smoke">looks saved on this device</p>
        <Link href="/wishlist" className="mt-4 inline-block text-[11px] uppercase tracking-[0.12em] underline underline-offset-2">
          View looks
        </Link>
      </div>
    </div>
  );
}
