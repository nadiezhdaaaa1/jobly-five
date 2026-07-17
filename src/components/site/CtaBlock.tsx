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
    <section className="mx-auto max-w-[1200px] px-5 py-16 md:px-8">
      <div className="rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-8 md:p-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl md:text-3xl">{title}</h2>
          <p className="mt-3 text-[color:var(--color-text-secondary)]">{subtitle}</p>
          <div className="mt-6 flex justify-center">
            <Link
              to="/quiz"
              className="inline-flex h-11 items-center rounded-button bg-[color:var(--color-accent)] px-5 text-sm text-[color:var(--color-on-accent)] transition-colors hover:bg-[color:var(--color-accent-hover)]"
            >
              {cta}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}