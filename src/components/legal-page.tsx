import Link from "next/link";
import { Eyebrow } from "./ui";

export interface LegalSection {
  heading: string;
  body: string[];
}

export function LegalPage({
  title,
  eyebrow,
  updated,
  intro,
  sections,
}: {
  title: string;
  eyebrow: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <div>
      <section className="border-b border-ink/10 bg-cream">
        <div className="container-ww py-12 sm:py-16">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="display mt-3 max-w-3xl text-[clamp(2.1rem,4.2vw,3.4rem)]">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-graphite">{intro}</p>
          <p className="mt-5 text-[10px] uppercase tracking-[0.14em] text-stone">Last updated {updated}</p>
        </div>
      </section>

      <div className="container-ww py-12">
        <div className="grid gap-12 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="eyebrow mb-3">On this page</p>
            <ul className="space-y-2">
              {sections.map((section, index) => (
                <li key={section.heading}>
                  <a
                    href={`#section-${index + 1}`}
                    className="text-[12px] leading-snug text-smoke transition-colors hover:text-ink"
                  >
                    {section.heading}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-6 border-t border-ink/10 pt-4">
              <p className="text-[11px] leading-relaxed text-stone">
                Questions?{" "}
                <Link href="/contact" className="text-ink underline underline-offset-2">
                  Contact the team
                </Link>
                .
              </p>
            </div>
          </aside>

          <article className="max-w-2xl">
            {sections.map((section, index) => (
              <section key={section.heading} id={`section-${index + 1}`} className="mb-9 scroll-mt-24">
                <h2 className="font-display text-2xl">{section.heading}</h2>
                <div className="mt-3 space-y-3">
                  {section.body.map((paragraph) => (
                    <p key={paragraph.slice(0, 24)} className="text-sm leading-relaxed text-graphite">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}

            <div className="mt-12 border-t border-ink/10 pt-6 text-[11px] leading-relaxed text-stone">
              WearWise AI is an affiliate fashion discovery platform built as a demonstration
              project. Nothing here constitutes legal advice; review these policies with a qualified
              professional before a commercial launch.
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
