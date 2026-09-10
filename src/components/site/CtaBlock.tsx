import { CtaLink } from "./CtaLink";
import { HeroShaderBackground } from "../landing/HeroShaderBackground";

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
    <section className="relative isolate overflow-hidden">
      <HeroShaderBackground />

      {/* Frame lines, drawn on top of the full-bleed gradient — the same
          treatment as the hero and the landing page's closing CTA. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[2] hidden lg:block">
        <div className="absolute bottom-0 left-12 top-0 w-px bg-white/30" />
        <div className="absolute bottom-0 right-12 top-0 w-px bg-white/30" />
      </div>

      <div className="relative z-10 lg:mx-12">
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
              <CtaLink className="main_accent_button">{cta}</CtaLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
