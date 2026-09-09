import { useState } from "react";
import { IconChevronDown as ChevronDown } from "@tabler/icons-react";

export const faqs = [
  {
    q: "What is Jobly?",
    a: "Jobly is an email-first job discovery service for tech candidates. You fill out a short profile once and receive five ranked, AI-scored matches in your inbox — daily on Pro, weekly on Free.",
  },
  {
    q: "How does matching work?",
    a: "We score every open role against your profile across experience, skill overlap, industry fit, salary, and remote preferences. Each match ships with a transparent \"why it fits\" — no black box.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel in two steps, or pause everything for six months when you land a job. No hoops.",
  },
  {
    q: "Is my data safe?",
    a: "We only use your profile to score jobs for you. We never sell your data and we don't apply on your behalf.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="border-b border-[color:var(--color-border)] bg-[color:var(--color-background)]">
      <div className="border-[color:var(--color-border)] lg:mx-12 lg:border-l lg:border-r">
      <div className="mx-auto max-w-[820px] px-5 py-16 md:px-8 md:py-24">
        <h2
          className="text-center text-3xl font-light leading-10 md:text-4xl"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.36px" }}
        >
          Frequently Asked Questions
        </h2>
        <div className="mt-10 space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={f.q}
                className="overflow-hidden rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)]"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-base">{f.q}</span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-[color:var(--color-text-muted)] transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-[color:var(--color-border)] px-5 py-4 text-sm text-[color:var(--color-text-secondary)]">
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      </div>
    </section>
  );
}
