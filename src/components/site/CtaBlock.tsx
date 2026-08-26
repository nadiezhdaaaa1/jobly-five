import { Link } from "@tanstack/react-router";

export function CtaBlock({
  title = "Ready for matches that actually fit?",
  subtitle = "Answer a few quick questions. We'll email you five ranked matches every day, scored to you.",
  cta = "Set up your matches",
}: {
  title?: string;
  subtitle?: string;
  cta?: string;
}) {
  return (
    <section className="border-b border-[color:var(--color-border)] bg-[color:var(--color-background)]">
      <div className="border-[color:var(--color-border)] bg-[color:var(--color-deep-teal)] lg:mx-12 lg:border-l lg:border-r">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center px-5 py-16 text-center md:px-8 md:py-24">
          <div className="max-w-[560px]">
            <h2
              className="text-[30px] leading-9 text-[color:var(--color-surface-1)]"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.3px" }}
            >
              {title}
            </h2>
            <p className="mt-3 leading-6 text-[color:var(--color-background)]">{subtitle}</p>
            <div className="mt-10">
              <Link
                to="/quiz"
                className="inline-flex h-11 items-center rounded-button bg-[color:var(--color-accent)] px-5 text-sm text-[color:var(--color-on-accent)] transition-colors hover:bg-[color:var(--color-accent-hover)]"
              >
                {cta}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
