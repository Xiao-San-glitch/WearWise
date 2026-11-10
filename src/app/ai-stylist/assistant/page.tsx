import type { Metadata } from "next";
import { getProducts } from "@/lib/db";
import { isGeminiConfigured } from "@/lib/gemini";
import { AiAssistant, type ChatProduct } from "@/components/ai-assistant";
import { Eyebrow } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Fashion Assistant",
  description: "Ask the WearWise stylist what to wear for any occasion, budget or colour.",
};

export default function AssistantPage() {
  const catalog: ChatProduct[] = getProducts().map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    image: product.image,
    price: product.price,
    category: product.category,
  }));

  return (
    <div>
      <section className="border-b border-ink/10 bg-cream">
        <div className="container-ww py-10 sm:py-12">
          <Eyebrow>AI Fashion Assistant</Eyebrow>
          <h1 className="display mt-3 max-w-2xl text-[clamp(2rem,4vw,3.2rem)]">
            Ask anything about what to wear.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-graphite">
            Occasions, budgets, colour pairings, or a piece already in your wardrobe — the assistant
            answers using only what&apos;s in the WearWise catalogue.
          </p>
        </div>
      </section>

      <div className="container-ww py-10">
        <AiAssistant catalog={catalog} configured={isGeminiConfigured()} />
      </div>
    </div>
  );
}
