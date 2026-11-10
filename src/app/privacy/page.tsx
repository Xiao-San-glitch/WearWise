import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How WearWise AI collects, uses and protects your information.",
};

const sections: LegalSection[] = [
  {
    heading: "Information we collect",
    body: [
      "Account information: your name, email address and a salted hash of your password when you create an account. We never store passwords in plain text.",
      "Styling information: the preferences you submit to the AI stylist (occasion, budget, colours, fit, season, category preferences and any free-text notes), the resulting recommendations, and your saved outfits.",
      "Usage information: pages you visit, products you view, searches you run, wishlist and cart contents stored in your browser, and outbound retailer links you click.",
      "Communications: the content of messages you send through the contact form or newsletter subscription.",
    ],
  },
  {
    heading: "How we use your information",
    body: [
      "To generate outfit recommendations and remember your styling preferences.",
      "To operate your account, save looks and show your history.",
      "To understand which products and categories are useful, and to report aggregate affiliate performance.",
      "To respond to enquiries and send the newsletter if you subscribe.",
    ],
  },
  {
    heading: "AI processing",
    body: [
      "When live AI is enabled, your styling brief and the eligible product catalogue are sent to Google's Gemini API to generate recommendations. Free-text instructions are included, so avoid entering sensitive personal information in the notes field.",
      "We do not send your name, email address or password to the AI provider. Product images are not sent — only structured product data.",
      "If no AI provider is configured, recommendations are generated locally on our server and no data leaves our infrastructure.",
    ],
  },
  {
    heading: "Cookies and local storage",
    body: [
      "We use one essential cookie to keep you signed in. It is HTTP-only, same-site and, in production, secure.",
      "Your wishlist, cart and locally saved looks are stored in your browser's local storage. Clearing site data removes them. Looks saved while signed in are additionally stored on your account.",
      "We do not use third-party advertising cookies. Affiliate links may set cookies on the retailer's domain once you leave WearWise; those are governed by the retailer's policy.",
    ],
  },
  {
    heading: "Sharing",
    body: [
      "We share data with service providers strictly to operate the product: our hosting provider, our AI provider (structured styling data only) and, if configured, our database and authentication provider.",
      "We do not sell personal information. Retailers receive only the standard referral parameters when you click an outbound link.",
    ],
  },
  {
    heading: "Retention and security",
    body: [
      "Account and styling records are retained while your account is active. Analytics records are aggregated and trimmed periodically. Contact messages are retained for up to 24 months.",
      "Access to administrative tools is restricted by server-side role checks. Passwords are hashed with scrypt and sessions are signed and expire after seven days.",
    ],
  },
  {
    heading: "Your rights",
    body: [
      "You can update your name and styling preferences from your account, clear locally stored wishlist and cart data by clearing site data, and request access to or deletion of your account data by contacting us.",
      "Depending on your jurisdiction — including under India's Digital Personal Data Protection Act, 2023 — you may have additional rights to correction, grievance redressal and withdrawal of consent.",
    ],
  },
  {
    heading: "Children",
    body: [
      "WearWise is not directed at children under 13, and we do not knowingly collect their personal information.",
    ],
  },
  {
    heading: "Contact",
    body: [
      "Privacy questions can be sent to hello@wearwise.ai or through the contact form. We aim to respond within one working day.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      updated="10 November 2026"
      intro="What we collect, why we collect it, and the choices you have. Written to be read, not to be hidden behind."
      sections={sections}
    />
  );
}
