"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Loader2, Sparkles } from "lucide-react";
import { inr } from "@/lib/format";

export interface ChatProduct {
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
  productIds?: string[];
  source?: "gemini" | "fallback";
}

const SUGGESTIONS = [
  "What should I wear to college?",
  "Suggest an outfit under ₹1,500.",
  "What matches black jeans?",
  "Suggest a minimalist outfit.",
  "What should I wear to a wedding?",
];

export function AiAssistant({
  catalog,
  configured,
}: {
  catalog: ChatProduct[];
  configured: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi, I'm your WearWise stylist. Ask me about an occasion, a budget, a colour or a piece you already own — I'll point you to pieces in the catalogue that work together.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const byId = new Map(catalog.map((product) => [product.id, product]));

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function send(question: string) {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = { id: `u_${Date.now()}`, role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const history = messages
        .filter((message) => message.id !== "welcome")
        .map((message) => ({ role: message.role, content: message.content }));

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
      });
      const data = (await response.json()) as {
        message?: string;
        productIds?: string[];
        source?: "gemini" | "fallback";
        error?: string;
      };
      if (!response.ok) {
        setError(data.error ?? "The stylist is unavailable right now.");
        return;
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: "assistant",
          content: data.message ?? "",
          productIds: data.productIds ?? [],
          source: data.source,
        },
      ]);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex min-h-[560px] flex-col border border-ink/10 bg-paper">
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-cream">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="text-xs font-medium">WearWise Assistant</p>
              <p className="text-[10px] uppercase tracking-[0.12em] text-stone">
                {configured ? "Live AI" : "Built-in stylist engine"}
              </p>
            </div>
          </div>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-6">
          {messages.map((message) => (
            <div key={message.id} className={message.role === "user" ? "flex justify-end" : ""}>
              <div className={message.role === "user" ? "max-w-[85%]" : "max-w-[92%]"}>
                <div
                  className={
                    message.role === "user"
                      ? "rounded-2xl rounded-br-sm bg-ink px-4 py-3 text-sm leading-relaxed text-cream"
                      : "rounded-2xl rounded-bl-sm bg-cream px-4 py-3 text-sm leading-relaxed text-graphite"
                  }
                >
                  {message.content}
                </div>

                {message.productIds && message.productIds.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {message.productIds.map((id) => {
                      const product = byId.get(id);
                      if (!product) return null;
                      return (
                        <Link
                          key={id}
                          href={`/product/${product.slug}`}
                          className="group border border-ink/10 bg-paper"
                        >
                          <div className="aspect-[3/4] overflow-hidden bg-sand">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                            />
                          </div>
                          <div className="p-2">
                            <p className="line-clamp-1 text-[10px] uppercase tracking-[0.08em] text-smoke">
                              {product.brand}
                            </p>
                            <p className="line-clamp-2 text-[11px] leading-snug">{product.name}</p>
                            <p className="mt-1 text-[11px] font-medium">{inr(product.price)}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {message.role === "assistant" && message.source && (
                  <p className="mt-1.5 text-[9px] uppercase tracking-[0.12em] text-stone">
                    {message.source === "gemini" ? "Gemini · WearWise catalogue" : "WearWise styling engine"}
                  </p>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-smoke">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Stylist is thinking…
            </div>
          )}
          {error && (
            <p className="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
          )}
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
              placeholder="Ask about an occasion, budget or piece…"
              className="max-h-32 min-h-[38px] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-stone"
              aria-label="Ask the stylist"
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
            Styling suggestions only. Check retailer pricing before purchase.
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
          <p className="text-[10px] uppercase tracking-[0.14em] text-smoke">Want the full look?</p>
          <p className="mt-2 text-[11px] leading-relaxed text-graphite">
            The assistant answers questions. The AI Stylist builds three complete, budget-checked
            outfits you can shop as a set.
          </p>
          <Link href="/ai-stylist" className="btn-secondary mt-4 w-full py-2.5 text-[10px]">
            <Sparkles className="h-3.5 w-3.5" /> Open AI Stylist
          </Link>
        </div>
      </aside>
    </div>
  );
}
