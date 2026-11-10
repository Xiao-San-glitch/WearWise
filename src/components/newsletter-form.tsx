"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/format";

export function NewsletterForm({ variant = "light" }: { variant?: "light" | "dark" }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Try again.");
        return;
      }
      setStatus("done");
      setMessage(data.message ?? "You're on the list.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  const dark = variant === "dark";

  if (status === "done") {
    return (
      <p className={cn("flex items-center gap-2 text-sm", dark ? "text-cream" : "text-ink")}>
        <Check className="h-4 w-4" /> {message}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="w-full">
      <div
        className={cn(
          "flex items-center gap-3 border-b pb-3",
          dark ? "border-cream/30" : "border-ink/25",
        )}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Your email address"
          aria-label="Email address for newsletter"
          className={cn(
            "w-full bg-transparent text-sm outline-none",
            dark ? "text-cream placeholder:text-cream/50" : "placeholder:text-stone",
          )}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          aria-label="Subscribe"
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
            dark ? "bg-cream text-ink hover:bg-white" : "bg-ink text-cream hover:bg-graphite",
          )}
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      {status === "error" && <p className="mt-2 text-xs text-red-600">{message}</p>}
      <p className={cn("mt-2 text-[11px]", dark ? "text-cream/50" : "text-stone")}>
        New drops and styling notes. No spam, unsubscribe anytime.
      </p>
    </form>
  );
}
