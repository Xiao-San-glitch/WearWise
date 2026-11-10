import type { Metadata } from "next";
import { StylistResults } from "@/components/stylist-results";

export const metadata: Metadata = {
  title: "Your AI looks",
  description: "Complete outfits assembled for your brief, within your budget.",
};

export default function StylistResultsPage() {
  return <StylistResults />;
}
