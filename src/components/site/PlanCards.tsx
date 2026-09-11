// The single source of truth for the three plan cards. Both the landing pricing
// section and the plan step after /matches render this, so the copy, cycles and
// auto-renewal disclosures cannot drift between the two surfaces.
//
// Every price, total, percentage and trial length comes from @/config/pricing.

import { IconCheck as Check } from "@tabler/icons-react";

import { PRICING, TRIAL_DAYS, discountPct, total, usd } from "@/config/pricing";
import type { BillingCycle } from "@/lib/subscription.functions";
import type { IntentPlan } from "@/lib/onboarding/planIntent";

export type PlanCardSpec = {
  key: "trial" | "monthly" | "annual";
  name: string;
  /** Struck-through comparison price, empty when the card has none. */
  struck: string;
  price: string;
  suffix: string;
  /** One line that makes the card's billing moment legible. */
  note: string;
  badge: string;
  cta: string;
  disclosure: string;
  /** Drives only the CTA variant: true = main accent button. */
  ctaMain: boolean;
  /** Drives only the glow and the lighter card background. */
  highlight: boolean;
  choice: { plan: IntentPlan; cycle: BillingCycle; trial: boolean };
};

const MONTHLY_DISCLOSURE = `Auto-renews at ${usd(
  PRICING.monthly.perMonth,
)}/month until cancelled. Cancel anytime in Settings → Plan in two steps.`;

const ANNUAL_DISCLOSURE = `Auto-renews at ${usd(
  total(PRICING.annual),
)}/year until cancelled. Cancel anytime in Settings → Plan in two steps.`;

export const PLAN_CARDS: PlanCardSpec[] = [
  {
    key: "trial",
    name: "Free trial",
    struck: "",
    price: usd(PRICING.monthly.perMonth),
    suffix: "per month",
    note: `Free for the first ${TRIAL_DAYS} days`,
    badge: "",
    cta: `Start ${TRIAL_DAYS}-day free trial`,
    disclosure: MONTHLY_DISCLOSURE,
    highlight: false,
    choice: { plan: "trial", cycle: "monthly", trial: true },
  },
  {
    key: "monthly",
    name: "Monthly",
    struck: "",
    price: usd(PRICING.monthly.perMonth),
    suffix: "per month",
    note: "Starts today, no trial",
    badge: "",
    cta: "Get Pro monthly",
    disclosure: MONTHLY_DISCLOSURE,
    highlight: false,
    choice: { plan: "pro", cycle: "monthly", trial: false },
  },
  {
    key: "annual",
    name: "Annual",
    struck: usd(PRICING.monthly.perMonth),
    price: usd(PRICING.annual.perMonth),
    suffix: "per month",
    note: `Billed ${usd(total(PRICING.annual))} yearly`,
    badge: `Save ${discountPct(PRICING.annual)}%`,
    cta: "Get Pro annual",
    disclosure: ANNUAL_DISCLOSURE,
    highlight: true,
    choice: { plan: "pro", cycle: "annual", trial: false },
  },
];

// The trial now grants full Pro access, so every card shows the same list.
const FEATURES = [
  "Matches per digest — Top 5",
  "Digest frequency — Daily",
  'AI match score and "why it fits"',
  "Application tracker",
  "Follow-up reminders",
  '"Found a job" pause',
];

function FeatureList() {
  return (
    <ul className="flex flex-col" style={{ gap: 12, padding: "8px 0" }}>
      {FEATURES.map((label) => (
        <li key={label} className="flex items-center" style={{ gap: 8 }}>
          <span
            className="inline-flex shrink-0 items-center justify-center rounded-full"
            style={{ width: 16, height: 16, background: "var(--color-mint)" }}
          >
            <Check size={11} strokeWidth={2.5} style={{ color: "var(--color-foreground)" }} />
          </span>
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 300,
              fontSize: 13,
              lineHeight: "19.5px",
              color: "var(--color-foreground)",
            }}
          >
            {label}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function PlanCard({
  card,
  onSelect,
}: {
  card: PlanCardSpec;
  onSelect: (card: PlanCardSpec) => void;
}) {
  return (
    <div
      className="flex-1 min-w-0"
      style={{ background: "#F1F3F3", borderRadius: 28, padding: 16 }}
    >
      <div
        className="relative flex h-full flex-col"
        style={{
          background: card.highlight ? "rgba(255,255,255,0.8)" : "#F9FBFB",
          border: "1px solid #FFFFFF",
          borderRadius: 16,
          padding: 21,
          gap: 16,
          boxShadow: card.highlight
            ? "0 1px 4px rgba(12,12,13,0.05)"
            : "0 1px 2px rgba(12,12,13,0.05)",
          overflow: "hidden",
          isolation: "isolate",
        }}
      >
        {card.highlight ? (
          <span
            aria-hidden="true"
            className="pricing-paid-glow"
            style={{
              position: "absolute",
              top: -120,
              right: -120,
              width: 360,
              height: 360,
              background:
                "radial-gradient(circle, var(--color-green) 0%, rgba(0,241,169,0) 70%)",
              filter: "blur(60px)",
              opacity: 0.45,
              zIndex: 1,
              pointerEvents: "none",
            }}
          />
        ) : null}

        <div className="relative flex flex-col" style={{ flex: 1, zIndex: 2 }}>
          <div className="flex items-start justify-between" style={{ gap: 8 }}>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 400,
                fontSize: 16,
                lineHeight: "24px",
                color: "var(--color-foreground)",
              }}
            >
              {card.name}
            </div>
            {card.badge ? (
              <span
                style={{
                  background: "var(--color-step-accent)",
                  borderRadius: 24,
                  padding: "4px 8px",
                  fontFamily: "var(--font-sans)",
                  fontWeight: 400,
                  fontSize: 12,
                  lineHeight: "16px",
                  color: "#FFFFFF",
                  whiteSpace: "nowrap",
                }}
              >
                {card.badge}
              </span>
            ) : null}
          </div>

          <div className="mt-auto flex flex-col" style={{ gap: 4, justifyContent: "flex-end" }}>
            <div
              style={{
                minHeight: 20,
                fontFamily: "var(--font-sans)",
                fontWeight: 300,
                fontSize: 14,
                lineHeight: 1.5,
                color: "#67787C",
                textDecoration: card.struck ? "line-through" : "none",
              }}
            >
              {card.struck || "\u00A0"}
            </div>
            <div className="flex flex-wrap items-baseline" style={{ gap: 8 }}>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 400,
                  fontSize: 32,
                  lineHeight: 1.05,
                  color: "var(--color-foreground)",
                }}
              >
                {card.price}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: 300,
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: "#67787C",
                }}
              >
                {card.suffix}
              </span>
            </div>
            <div
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 300,
                fontSize: 13,
                lineHeight: "19.5px",
                color: "#4B585B",
              }}
            >
              {card.note}
            </div>
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 2 }}>
          <FeatureList />
        </div>

        <button
          type="button"
          onClick={() => onSelect(card)}
          className={
            card.highlight
              ? "main_accent_button main_accent_button--on-light main_accent_button--block relative z-[2]"
              : "secondary_button secondary_button--on-light secondary_button--block relative z-[2]"
          }
        >
          {card.cta}
        </button>
        <p className="relative z-[2] text-center text-xs text-[color:var(--color-text-muted)]">
          {card.disclosure}
        </p>
      </div>
    </div>
  );
}

export function PlanCardsGrid({ onSelect }: { onSelect: (card: PlanCardSpec) => void }) {
  return (
    <div className="flex w-full items-stretch gap-5 max-lg:!flex-col">
      {PLAN_CARDS.map((card) => (
        <PlanCard key={card.key} card={card} onSelect={onSelect} />
      ))}
    </div>
  );
}
