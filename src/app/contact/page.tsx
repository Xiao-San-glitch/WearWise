import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, MapPin, MessageCircle } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { Eyebrow } from "@/components/ui";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the WearWise AI team about styling, partnerships or the affiliate programme.",
};

const FAQS = [
  {
    question: "Can I buy directly on WearWise?",
    answer:
      "No — WearWise is a discovery platform. We link you to the retailer who holds the stock, and they handle payment, delivery and returns.",
  },
  {
    question: "How accurate are the prices?",
    answer:
      "Prices are indicative and set by the retailer. They can change without notice, so always confirm on the retailer's page before buying.",
  },
  {
    question: "Is the AI stylist free?",
    answer:
      "Yes. Styling, saved looks and the assistant are free. We may earn a commission if you shop through our links, at no extra cost to you.",
  },
  {
    question: "Can I request a specific brand?",
    answer:
      "Yes — mention it in the additional instructions on the stylist form, or ask the assistant directly. We'll use it if it's in the catalogue.",
  },
];

export default function ContactPage() {
  return (
    <div>
      <section className="border-b border-ink/10 bg-cream">
        <div className="container-ww py-12 sm:py-16">
          <Eyebrow>Contact</Eyebrow>
          <h1 className="display mt-3 max-w-2xl text-[clamp(2.2rem,4.4vw,3.6rem)]">
            Talk to a human.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-graphite">
            Styling questions, partnership ideas, or something not working? Send a note and we&apos;ll
            get back to you.
          </p>
        </div>
      </section>

      <div className="container-ww py-12">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="max-w-2xl">
            <ContactForm />
          </div>

          <aside className="space-y-6">
            <div className="border border-ink/10 bg-cream p-5">
              <p className="text-[10px] uppercase tracking-[0.14em] text-smoke">Reach us</p>
              <ul className="mt-4 space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 text-stone" />
                  <span>
                    hello@wearwise.ai
                    <span className="block text-[11px] text-stone">General & styling</span>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <MessageCircle className="mt-0.5 h-4 w-4 text-stone" />
                  <span>
                    partners@wearwise.ai
                    <span className="block text-[11px] text-stone">Brands & affiliates</span>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-stone" />
                  <span>
                    Bengaluru, India
                    <span className="block text-[11px] text-stone">Remote-first team</span>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 text-stone" />
                  <span>
                    Mon–Fri, 10:00–18:00 IST
                    <span className="block text-[11px] text-stone">Replies within one working day</span>
                  </span>
                </li>
              </ul>
            </div>

            <div className="border border-ink/10 p-5">
              <p className="text-[10px] uppercase tracking-[0.14em] text-smoke">Faster answers</p>
              <p className="mt-2 text-[11px] leading-relaxed text-graphite">
                Styling questions are usually answered instantly by the assistant.
              </p>
              <Link href="/ai-stylist/assistant" className="btn-secondary mt-4 w-full py-2.5 text-[10px]">
                Ask the AI assistant
              </Link>
            </div>
          </aside>
        </div>

        <section className="mt-16 max-w-3xl">
          <h2 className="font-display text-2xl">Frequently asked</h2>
          <div className="mt-5 divide-y divide-ink/10 border-y border-ink/10">
            {FAQS.map((faq) => (
              <details key={faq.question} className="group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm">
                  {faq.question}
                  <span className="text-stone transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-smoke">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
