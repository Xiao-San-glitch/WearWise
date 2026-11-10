import Link from "next/link";
import { ArrowRight, Search, Sparkles } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-ww flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="eyebrow">404</p>
      <h1 className="display mt-4 max-w-xl text-[clamp(2.4rem,5vw,4rem)]">
        This piece has left the rail.
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-smoke">
        The page you were looking for doesn&apos;t exist, or the product is no longer in the
        catalogue. Let&apos;s find something better.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="btn-primary">
          <Search className="h-3.5 w-3.5" /> Shop the collection
        </Link>
        <Link href="/ai-stylist" className="btn-secondary">
          <Sparkles className="h-3.5 w-3.5" /> Ask the stylist
        </Link>
      </div>
      <Link href="/" className="mt-8 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-smoke hover:text-ink">
        Back home <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
