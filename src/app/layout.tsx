import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/components/store-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getSessionUser } from "@/lib/auth";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "WearWise AI — Your Style. Your Budget. Your AI Stylist.",
    template: "%s · WearWise AI",
  },
  description:
    "AI-powered fashion discovery for India. Build complete outfits within your budget from premium Indian labels, with a personal stylist that explains every choice.",
  keywords: ["AI fashion stylist", "Indian fashion", "outfit recommendations", "online shopping India"],
  openGraph: {
    title: "WearWise AI — Your Style. Your Budget. Your AI Stylist.",
    description:
      "Personalised outfit recommendations within your budget, powered by AI and real Indian labels.",
    type: "website",
    images: ["/products/291762.jpg"],
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <StoreProvider>
          <SiteHeader user={user} />
          <main className="min-h-[60vh]">{children}</main>
          <SiteFooter />
        </StoreProvider>
      </body>
    </html>
  );
}
