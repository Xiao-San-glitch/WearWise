"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, Loader2, MessageCircle, Sparkles } from "lucide-react";
import type { GeneratedWardrobeOutfit, WardrobeItem } from "@/lib/types";
import { inr } from "@/lib/format";
import { SmartImage } from "../smart-image";
import { StatusNote } from "./closet-shared";

interface AssistantProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  category: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  outfit?: GeneratedWardrobeOutfit;
  outfits?: GeneratedWardrobeOutfit[];
  products?: AssistantProduct[];
  itemIds?: string[];
  source?: "gemini" | "rule";
}

const SUGGESTIONS = [
  "What should I wear to college tomorrow?",
  "Create 3 outfits using my existing clothes.",
  "What should I buy under ₹1,000?",
  "Which clothes match my black jeans?",
  "Create an outfit for a party.",
  "What is missing from my wardrobe?",
];

export function ClosetAssistant({
  items,
  onAddPieces,
}: {
  items: WardrobeItem[];
  onAddPieces: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages((prev) =>
      prev.length
        ? prev
        : [
            {
              id: "welcome",
              role: "assistant",
              content: items.length
                ? `I can see ${items.length} pieces in your wardrobe. Ask me what to wear, what matches a specific piece, what to buy within a budget, or what's missing. I only use clothes you actually own.`
                : "Your wardrobe is empty right now. Add a few pieces and I can answer using exactly what you own — otherwise I'll stick to general advice.",
            },
          ],
    );
  }, [items.length]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function send(question: string) {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { id: `u_${Date.now()}`, role: "user", content: trimmed }]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/wardrobe/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = (await response.json()) as {
        message?: string;
        outfit?: GeneratedWardrobeOutfit;
        outfits?: GeneratedWardrobeOutfit[];
        products?: AssistantProduct[];
        wardrobeItemIds?: string[];
        source?: "gemini" | "rule";
        error?: string;
      };
      if (!response.ok || !data.message) {
        setError(data.error ?? "The wardrobe assistant is unavailable right now.");
        return;
      }
      const replyText = data.message;
      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: "assistant",
          content: replyText,
          outfit: data.outfit,
          outfits: data.outfits,
          products: data.products,
          itemIds: data.wardrobeItemIds,
          source: data.source,
        },
      ]);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const byId = new Map(items.map((item) => [item.id, item]));

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex min-h-[560px] flex-col border border-ink/10 bg-paper">
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-cream">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="text-xs font-medium">Wardrobe stylist</p>
              <p className="text-[10px] uppercase tracking-[0.12em] text-stone">
                Rule-based · uses your real closet
              </p>
            </div>
          </div>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-6">
          {messages.map((message) => (
            <div key={message.id} className={message.role === "user" ? "flex justify-end" : ""}>
              <div className={message.role === "user" ? "max-w-[85%]" : "max-w-[94%]"}>
                <div
                  className={
                    message.role === "user"
                      ? "rounded-2xl rounded-br-sm bg-ink px-4 py-3 text-sm leading-relaxed text-cream"
                      : "rounded-2xl rounded-bl-sm bg-cream px-4 py-3 text-sm leading-relaxed text-graphite"
                  }
                >
                  {message.content}
                </div>

                {message.outfit && <AssistantOutfitCard outfit={message.outfit} />}

                {message.outfits && message.outfits.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.outfits.map((outfit) => (
                      <AssistantOutfitCard key={outfit.id} outfit={outfit} compact />
                    ))}
                  </div>
                )}

                {message.products && message.products.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {message.products.map((product) => (
                      <Link
                        key={product.id}
                        href={`/product/${product.slug}`}
                        className="group border border-ink/10 bg-paper"
                      >
                        <div className="aspect-[3/4] overflow-hidden bg-sand">
                          <SmartImage
                            src={product.image}
                            alt={product.name}
                            label={product.name}
                            className="transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                        <div className="p-2">
                          <p className="line-clamp-1 text-[9px] uppercase tracking-[0.08em] text-smoke">
                            {product.brand}
                          </p>
                          <p className="line-clamp-2 text-[11px] leading-snug">{product.name}</p>
                          <p className="mt-1 text-[11px] font-medium">{inr(product.price)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {message.itemIds && message.itemIds.length > 0 && !message.outfit && !message.outfits?.length && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.itemIds.slice(0, 6).map((id) => {
                      const item = byId.get(id);
                      if (!item) return null;
                      return (
                        <div key={id} className="flex items-center gap-2 border border-ink/10 bg-paper p-1.5 pr-3">
                          <div className="h-9 w-7 overflow-hidden bg-sand">
                            <SmartImage src={item.image} alt={item.name} label={item.name} />
                          </div>
                          <span className="text-[10px] leading-tight">{item.name}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {message.role === "assistant" && message.source && (
                  <p className="mt-1.5 text-[9px] uppercase tracking-[0.12em] text-stone">
                    {message.source === "gemini" ? "Gemini · your wardrobe" : "WearWise wardrobe engine"}
                  </p>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-smoke">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking your wardrobe…
            </div>
          )}
          {error && <StatusNote kind="error">{error}</StatusNote>}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            send(input);
          }}
          className="border-t border-ink/10 p-3 sm:p-4"
        >
          <div className="flex items-end gap-2 border border-ink/15 bg-paper p-2 focus-within:border-ink">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              maxLength={600}
              placeholder="Ask about an occasion, a piece you own or a budget…"
              className="max-h-32 min-h-[38px] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-stone"
              aria-label="Ask your wardrobe stylist"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-cream disabled:opacity-40"
              aria-label="Send message"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-[10px] text-stone">
            Answers are generated from pairing rules over your closet. No purchase happens here.
          </p>
        </form>
      </div>

      <aside>
        <p className="eyebrow mb-3">Try asking</p>
        <div className="space-y-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => send(suggestion)}
              disabled={loading}
              className="w-full border border-ink/10 bg-paper px-4 py-3 text-left text-[12px] leading-snug text-graphite transition-colors hover:border-ink disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div className="mt-6 border border-ink/10 bg-cream p-4">
          <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-smoke">
            <MessageCircle className="h-3.5 w-3.5" /> Need more pieces?
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-graphite">
            Ask what&apos;s missing, or open the Missing pieces tab for scored recommendations from the
            live catalogue.
          </p>
          <button onClick={onAddPieces} className="btn-secondary mt-4 w-full py-2.5 text-[10px]">
            Add wardrobe pieces
          </button>
        </div>
      </aside>
    </div>
  );
}

function AssistantOutfitCard({
  outfit,
  compact,
}: {
  outfit: GeneratedWardrobeOutfit;
  compact?: boolean;
}) {
  return (
    <div className="border border-ink/10 bg-paper">
      <div className="flex gap-px bg-ink/10">
        {outfit.items.slice(0, compact ? 4 : 6).map((item) => (
          <div key={item.id} className="relative aspect-[3/4] flex-1 overflow-hidden bg-sand">
            <SmartImage src={item.image} alt={item.name} label={item.name} />
          </div>
        ))}
      </div>
      <div className="p-3">
        <p className="text-[9px] uppercase tracking-[0.12em] text-smoke">
          {outfit.occasion} · {outfit.style}
        </p>
        <p className="mt-1 font-display text-base leading-snug">{outfit.title}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-smoke">
          {outfit.items.map((item) => item.name).join(" · ")}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] font-medium tabular">Estimated value {inr(outfit.total)}</span>
          <span className="text-[10px] text-stone">{outfit.score}/100 match</span>
        </div>
      </div>
    </div>
  );
}
