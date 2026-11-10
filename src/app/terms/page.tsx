import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "The terms that govern your use of WearWise AI.",
};

const sections: LegalSection[] = [
  {
    heading: "What WearWise is",
    body: [
      "WearWise AI is a fashion discovery and styling platform. We recommend products sold by third-party retailers and provide links to those retailers.",
      "We are not a retailer. We do not hold stock, process payments, arrange delivery or handle returns. When you click through to a retailer, a separate contract is formed between you and them.",
    ],
  },
  {
    heading: "Accounts",
    body: [
      "You are responsible for the accuracy of your account details and for keeping your password confidential. Do not share your account.",
      "We may suspend accounts that abuse the service, attempt to access administrative areas without authorisation, or interfere with other users.",
    ],
  },
  {
    heading: "AI recommendations",
    body: [
      "Outfit recommendations are generated automatically from your brief and our catalogue. They are suggestions, not professional advice.",
      "AI output can be imperfect. Always check the product details, size guidance and price on the retailer's page before purchasing.",
      "We validate that recommended products exist in our catalogue and that outfit totals stay within your stated budget at the time of generation, but prices may change afterwards.",
    ],
  },
  {
    heading: "Product information and pricing",
    body: [
      "Product names, descriptions, images, prices and availability are provided for demonstration and discovery. Prices are indicative, shown in Indian Rupees, and may differ from the retailer's current price.",
      "Images are sourced from third-party photography libraries and are illustrative; the delivered product may vary slightly in shade or detail.",
    ],
  },
  {
    heading: "Affiliate links",
    body: [
      "Some links on WearWise are affiliate links. If you click one and make a purchase, we may earn a commission at no extra cost to you. Sponsored products are labelled.",
      "Affiliate relationships never determine the included products in a generated outfit; the stylist operates on the catalogue and your stated preferences.",
    ],
  },
  {
    heading: "Acceptable use",
    body: [
      "Do not scrape the catalogue at scale, attempt to bypass rate limits, reverse engineer authentication, or use the service to distribute unlawful or harmful content.",
      "Administrative features are restricted to authorised accounts and protected by server-side role checks.",
    ],
  },
  {
    heading: "Availability",
    body: [
      "We aim to keep the service available but do not guarantee uninterrupted access. Features that depend on third-party services — including live AI and retailer websites — may be unavailable from time to time. Where live AI is unavailable, the built-in styling engine provides recommendations.",
    ],
  },
  {
    heading: "Limitation of liability",
    body: [
      "To the extent permitted by law, WearWise is not liable for losses arising from purchases made on retailer sites, from inaccurate product information supplied by third parties, or from decisions taken on the basis of a style recommendation.",
    ],
  },
  {
    heading: "Governing law",
    body: [
      "These terms are governed by the laws of India, with courts in Bengaluru having exclusive jurisdiction. If any provision is found unenforceable, the remaining provisions continue in effect.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms & Conditions"
      updated="10 November 2026"
      intro="The ground rules for using WearWise AI, including what we do and do not do as an affiliate platform."
      sections={sections}
    />
  );
}
