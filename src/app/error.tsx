"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-ww flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="eyebrow">Something interrupted the styling</p>
      <h1 className="display mt-4 max-w-xl text-[clamp(2.2rem,4.4vw,3.4rem)]">
        That didn&apos;t load as expected.
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-smoke">
        An unexpected error occurred. You can retry, or head back to the storefront — your bag and
        wishlist are safe in this browser.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button onClick={reset} className="btn-primary">
          <RotateCcw className="h-3.5 w-3.5" /> Try again
        </button>
        <Link href="/" className="btn-secondary">
          Back home
        </Link>
      </div>
      {error.digest && (
        <p className="mt-6 text-[10px] uppercase tracking-[0.12em] text-stone">
          Reference: {error.digest}
        </p>
      )}
    </div>
  );
}
