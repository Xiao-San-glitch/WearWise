import Link from "next/link";
import { SmartImage } from "./smart-image";
import { Eyebrow } from "./ui";

export function AuthLayout({
  image,
  quote,
  quoteMeta,
  eyebrow,
  title,
  subtitle,
  children,
}: {
  image: string;
  quote: string;
  quoteMeta: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid lg:grid-cols-2">
      <div className="relative hidden min-h-[720px] bg-ink lg:block">
        <SmartImage src={image} alt="WearWise editorial" wrapperClassName="absolute inset-0" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-ink/20" />
        <div className="absolute inset-x-0 bottom-0 p-12">
          <p className="font-display text-3xl leading-snug text-cream">“{quote}”</p>
          <p className="mt-4 text-[10px] uppercase tracking-[0.16em] text-cream/60">{quoteMeta}</p>
        </div>
        <Link
          href="/"
          className="absolute left-10 top-8 font-display text-2xl text-cream"
        >
          WearWise <span className="align-super text-[10px] uppercase tracking-[0.14em]">AI</span>
        </Link>
      </div>

      <div className="flex items-center justify-center px-5 py-14 sm:px-10">
        <div className="w-full max-w-[400px]">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="display mt-3 text-[clamp(2rem,4vw,2.8rem)]">{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-smoke">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
