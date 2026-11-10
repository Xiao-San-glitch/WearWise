"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/format";

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  priority?: boolean;
  label?: string;
}

/**
 * Image with a graceful monogram fallback so a missing/blocked asset never
 * renders as a broken image icon. Handles the case where an image is already
 * complete before React hydrates (common for LCP/hero images), which would
 * otherwise leave the fade-in stuck at opacity 0.
 */
export function SmartImage({ src, alt, className, wrapperClassName, priority, label }: SmartImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const image = imgRef.current;
    if (image?.complete) {
      if (image.naturalWidth > 0) setLoaded(true);
      else setFailed(true);
    }
  }, [src]);

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-sand/60", wrapperClassName)}>
      {!failed ? (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          onError={() => setFailed(true)}
          onLoad={() => setLoaded(true)}
          className={cn(
            "h-full w-full object-cover transition-[opacity,transform] duration-700",
            loaded ? "opacity-100" : "opacity-0",
            className,
          )}
        />
      ) : (
        <div className="grain flex h-full w-full flex-col items-center justify-center gap-1 bg-sand text-ink/40">
          <span className="font-display text-xl">W</span>
          <span className="px-3 text-center text-[9px] uppercase tracking-[0.2em]">{label ?? alt}</span>
        </div>
      )}
    </div>
  );
}
