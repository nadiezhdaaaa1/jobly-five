// The single source of truth for the four plan cards. Both the landing pricing
// section and the plan step after /matches render this, so the copy, SKUs and
// disclosures cannot drift between the two surfaces.
//
// Every price, total, percentage and trial length comes from @/config/pricing.
//
// The Watch card carries its own local Monthly/Annual switch. That is per-card
// by design — there is deliberately no section-wide period toggle.

import { useState } from "react";
import { IconCheck as Check } from "@tabler/icons-react";

import {
  SHARED_PLAN_DISCLOSURE,
  SKUS,
  TRIAL_DAYS,
  WATCH_MONTHLY_ANNUALISED,
  discountPct,
  perMonth,
  skuDisclosure,
  skuTotal,
  usd,
  type SkuId,
} from "@/config/pricing";
import type { SelectPlanInput } from "@/lib/onboarding/usePlanFlow";

export type PlanCardSpec = {
  key: "watch" | "pro_monthly" | "pro_3month" | "pro_6month";
  name: string;
  /** Struck-through comparison price, empty when the card has none. */
  struck: string;
  price: string;
  suffix: string;
  /** One line that makes the card's billing moment legible. */
  note: string;
  badge: string;
  cta: string;
  /** Price + interval for this card. The shared line never replaces it. */
  disclosure: string;
  /** Drives only the CTA variant: true = main accent button. */
  ctaMain: boolean;
  /** Drives only the glow and the card emphasis. */
  highlight: boolean;
  /** Feature bullets belong to the Pro tier only until the marketing pass. */
  showFeatures: boolean;
  choice: SelectPlanInput;
};

function watchCard(sku: Extract<SkuId, "watch_monthly" | "watch_annual">): PlanCardSpec {
  const annual = sku === "watch_annual";
  return {
    key: "watch",
    name: "Watch",
    struck: annual ? usd(perMonth("watch_monthly")) : "",
    price: usd(perMonth(sku)),
    suffix: "per month",
    note: annual
      ? `Billed ${usd(skuTotal(sku))} yearly`
      : `${usd(WATCH_MONTHLY_ANNUALISED)} a year at this rate`,
    badge: annual ? `Save ${discountPct(sku)}%` : "",
    cta: annual ? "Get Watch yearly" : "Get Watch monthly",
    disclosure: skuDisclosure(sku),
    ctaMain: false,
    highlight: false,
    showFeatures: false,
    choice: { sku, trial: false },
  };
}

function proCard(
  sku: Extract<SkuId, "pro_monthly" | "pro_3month" | "pro_6month">,
): PlanCardSpec {
  const { months } = SKUS[sku];
  const trial = sku === "pro_monthly";
  return {
    key: sku,
    name: trial ? "Pro monthly" : `Pro ${months} months`,
    struck: trial ? "" : usd(perMonth("pro_monthly")),
    price: usd(perMonth(sku)),
    suffix: "per month",
    // The trial folds into the Pro monthly card; there is no standalone trial card.
    note: trial
      ? `Free for the first ${TRIAL_DAYS} days`
      : `Billed ${usd(skuTotal(sku))} every ${months} months`,
    badge: trial ? "" : `Save ${discountPct(sku)}%`,
    cta: trial ? `Start ${TRIAL_DAYS}-day free trial` : `Get Pro — ${months} months`,
    disclosure: skuDisclosure(sku),
    ctaMain: true,
    highlight: sku === "pro_6month",
    showFeatures: true,
    choice: { sku, trial },
  };
}

export const PRO_CARDS: PlanCardSpec[] = [
  proCard("pro_monthly"),
  proCard("pro_3month"),
  proCard("pro_6month"),
];

const PRO_FEATURES = [
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
      {PRO_FEATURES.map((label) => (
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

/** Watch-only Monthly/Annual switch. Never a section-wide toggle. */
function WatchPeriodSwitch({
  value,
  onChange,
}: {
  value: "monthly" | "annual";
  onChange: (v: "monthly" | "annual") => void;
}) {
  const options: Array<{ id: "monthly" | "annual"; label: string }> = [
    { id: "monthly", label: "Monthly" },
    { id: "annual", label: "Annual" },
  ];
  return (
    <div
      role="group"
      aria-label="Watch billing period"
      className="inline-flex items-center"
      style={{
        background: "var(--color-surface-2)",
        borderRadius: 24,
        padding: 3,
        gap: 2,
      }}
    >
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.id)}
            style={{
              borderRadius: 24,
              padding: "4px 10px",
              fontFamily: "var(--font-sans)",
              fontWeight: 400,
              fontSize: 12,
              lineHeight: "16px",
              background: active ? "var(--color-surface-1)" : "transparent",
              color: active ? "var(--color-foreground)" : "var(--color-text-muted)",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function PlanCard({
  card,
  onSelect,
  headerExtra,
}: {
  card: PlanCardSpec;
  onSelect: (card: PlanCardSpec) => void;
  headerExtra?: React.ReactNode;
}) {
  return (
    <div
      className="relative z-0 flex h-full flex-1 min-w-0 flex-col rounded-[16px] transition-[transform,scale,border-radius] duration-[800ms] ease-[cubic-bezier(0.165,0.84,0.44,1)] [will-change:transform] hover:z-10 hover:scale-[1.036] hover:rounded-[15.444px] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:hover:rounded-[16px]"
      style={{
        background: "var(--color-surface-1)",
        border: "1px solid var(--color-border)",
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
            background: "radial-gradient(circle, var(--main-accent) 0%, rgba(44,255,142,0) 70%)",
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

        {headerExtra ? <div className="mt-3">{headerExtra}</div> : null}

        <div className="mt-auto flex flex-col" style={{ gap: 4, justifyContent: "flex-end" }}>
          <div
            style={{
              minHeight: 20,
              fontFamily: "var(--font-sans)",
              fontWeight: 300,
              fontSize: 14,
              lineHeight: 1.5,
              color: "var(--color-text-muted)",
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
                color: "var(--color-text-muted)",
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
              color: "var(--color-text-secondary)",
            }}
          >
            {card.note}
          </div>
        </div>
      </div>

      {card.showFeatures ? (
        <div style={{ position: "relative", zIndex: 2 }}>
          <FeatureList />
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => onSelect(card)}
        className={
          card.ctaMain
            ? "main_accent_button main_accent_button--on-light main_accent_button--block relative z-[2] mt-auto"
            : "secondary_button secondary_button--on-light secondary_button--block relative z-[2] mt-auto"
        }
      >
        {card.cta}
      </button>
      <p className="relative z-[2] text-center text-xs text-[color:var(--color-text-muted)]">
        {card.disclosure}
      </p>
    </div>
  );
}

export function PlanCardsGrid({ onSelect }: { onSelect: (card: PlanCardSpec) => void }) {
  // Local to the Watch card only.
  const [watchPeriod, setWatchPeriod] = useState<"monthly" | "annual">("monthly");
  const watch = watchCard(watchPeriod === "annual" ? "watch_annual" : "watch_monthly");

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex w-full items-stretch gap-5 max-lg:!flex-col">
        <PlanCard
          card={watch}
          onSelect={onSelect}
          headerExtra={<WatchPeriodSwitch value={watchPeriod} onChange={setWatchPeriod} />}
        />
        {PRO_CARDS.map((card) => (
          <PlanCard key={card.key} card={card} onSelect={onSelect} />
        ))}
      </div>
      {/* One shared line under all four: cancellation path, the pre-charge email
          promise and the currency. It never replaces a card's own disclosure. */}
      <p className="text-center text-xs text-[color:var(--color-text-muted)]">
        {SHARED_PLAN_DISCLOSURE}
      </p>
    </div>
  );
}
