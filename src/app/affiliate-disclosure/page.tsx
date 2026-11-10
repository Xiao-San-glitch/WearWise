import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Info } from "lucide-react";
import { LegalPage, type LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Affiliate Disclosure",
  description:
    "How WearWise AI earns commission, how sponsored products are labelled, and what we do not claim about your purchases.",
};

const sections: LegalSection[] = [
  {
    heading: "The short version",
    body: [
      "WearWise AI earns money when you click a product link and buy that product from a partner retailer. The price you pay is exactly the same as if you had gone to the retailer directly.",
      "We do not process payments, create orders or fulfil deliveries. Every purchase is completed on the retailer's website, under their terms and their returns policy.",
    ],
  },
  {
    heading: "Which links are affiliate links",
    body: [
      "Every “Buy now”, “Retailer” and checkout link that leaves WearWise is an affiliate link. The link routes through wearwise.ai/go/<product-id>, which records the click and then redirects to the retailer with tracking parameters such as utm_source=wearwise.",
      "We record the product, the time, the page that referred the click, and — when you are signed in — your account email. This lets us report which pieces are useful and improve recommendations.",
    ],
  },
  {
    heading: "Sponsored products",
    body: [
      "Some products are marked as sponsored. They display a “Sponsored” label on product cards and on the product page, and this label is applied from data in our catalogue — it is not hidden inside an image.",
      "Sponsored placement may influence where a product appears in editorial sections such as Trending, but it does not override the budget limit or product eligibility in an AI-generated outfit.",
    ],
  },
  {
    heading: "What we do not claim",
    body: [
      "We never claim that you purchased something when you only clicked a link. Our admin analytics distinguish between outbound clicks and estimated commission, and clearly label revenue figures as estimates.",
      "We do not display invented “sales” counts, fake reviews or fictitious order confirmations. If an order is confirmed, the confirmation comes from the retailer — not from WearWise.",
    ],
  },
  {
    heading: "Demo links in this build",
    body: [
      "In this demonstration build, affiliate links point to real retailer search pages with tracking parameters attached. They are functional and will open the retailer, but no commission is earned until the programme is configured.",
      "An administrator can replace each product's link from the Admin Studio → Affiliate links page. Changes take effect immediately for every outbound click.",
    ],
  },
  {
    heading: "Pricing and availability",
    body: [
      "Prices shown on WearWise are indicative and may not reflect the retailer's current price. Discounts are calculated against the MRP recorded in our catalogue.",
      "If a price looks wrong, trust the retailer's page. You can report discrepancies through the contact form.",
    ],
  },
  {
    heading: "Questions",
    body: [
      "For affiliate, partnership or disclosure questions, write to partners@wearwise.ai or use the contact form.",
    ],
  },
];

export default function AffiliateDisclosurePage() {
  return (
    <div>
      <LegalPage
        eyebrow="Transparency"
        title="Affiliate Disclosure"
        updated="10 November 2026"
        intro="WearWise is free to use because we earn a commission from partner retailers. This page explains exactly how that works."
        sections={sections}
      />

      <div className="container-ww pb-4">
        <div className="flex flex-col gap-4 border border-clay/25 bg-clay/5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-3 text-[12px] leading-relaxed text-graphite">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-clay" />
            You can verify any link yourself: hover a product card and check that it points to
            wearwise.ai/go/&lt;id&gt;, then to the retailer.
          </p>
          <Link href="/shop" className="btn-secondary shrink-0 py-2.5 text-[10px]">
            Browse products <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
