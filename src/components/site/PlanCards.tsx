// The single source of truth for the four plan cards. The landing pricing
// section, the plan step after /matches and the Settings plan block all render
// this, so the copy, SKUs and disclosures cannot drift between the surfaces.
//
// Every price, total, percentage and trial length comes from @/config/pricing.
//
// The Watch card carries its own local Monthly/Annual switch. That is per-card
// by design — there is deliberately no section-wide period toggle.

import { useState } from "react";

import {
  SHARED_PLAN_DISCLOSURE,
  SKUS,
  TRIAL_DAYS,
  WATCH_MONTHLY_ANNUALISED,
  discountPct,
  perMonth,
  renewalPhrase,
  skuTotal,
  usd,
  type SkuId,
} from "@/config/pricing";
import type { SelectPlanInput } from "@/lib/onboarding/usePlanFlow";

type BandTone = "muted" | "popular" | "best-value";

export type PlanCardSpec = {
  key: "watch" | "pro_monthly" | "pro_3month" | "pro_6month";
  /** Uppercase label in the header band above the card. */
  band: string;
  bandTone: BandTone;
  /** Wrapper tint behind the header band. */
  tint: string;
  name: string;
  price: string;
  suffix: string;
  /** One line that makes the card's billing moment legible. */
  subLine: string;
  description: string;
  cta: string;
  /** Drives only the CTA variant: true = main accent button. */
  ctaMain: boolean;
  /** Price + interval for this card. The shared line never replaces it. */
  disclosure: string;
  badge: { label: string; background: string; color: string } | null;
  /** Watch renders its badge in the title row: the switcher owns the top-right corner. */
  badgeInTitle: boolean;
  /** Corner glow hue, when the card carries one. */
  glow: "accent" | "step" | "neutral";
  /** Column gap inside the white card. */
  innerGap: number;
  choice: SelectPlanInput;
};

const savingsBadge = (sku: SkuId, tone: "accent" | "step") => ({
  label: `save ${discountPct(sku)}%`,
  background: tone === "accent" ? "var(--main-accent)" : "var(--step-accent)",
  color: tone === "accent" ? "var(--on-accent)" : "#FFFFFF",
});

function watchCard(sku: Extract<SkuId, "watch_monthly" | "watch_annual">): PlanCardSpec {
  const annual = sku === "watch_annual";
  return {
    key: "watch",
    band: "FOR PASSIVE CANDIDATES",
    bandTone: "muted",
    tint: "var(--color-surface-2)",
    name: "Watch",
    price: usd(perMonth(sku)),
    suffix: "/month",
    subLine: annual
      ? `${usd(skuTotal(sku))}/year — save ${discountPct(sku)}%`
      : `${usd(WATCH_MONTHLY_ANNUALISED)}/year`,
    description: "Stay in the loop — a weekly digest of scored matches, ghost jobs filtered out.",
    cta: "Get Watch",
    ctaMain: false,
    disclosure: `Charged today. ${renewalPhrase(sku)} until cancelled`,
    // Watch carries no savings pill: the switcher owns the top-right corner and
    // the saving is already stated in the sub-line.
    badge: null,
    badgeInTitle: false,
    glow: "neutral",
    innerGap: 32,
    choice: { sku, trial: false },
  };
}

export const PRO_CARDS: PlanCardSpec[] = [
  {
    key: "pro_monthly",
    band: "START HERE",
    bandTone: "muted",
    tint: "var(--color-surface-2)",
    name: "Pro · monthly",
    price: usd(perMonth("pro_monthly")),
    suffix: "/month",
    // The trial folds into the Pro monthly card; there is no standalone trial card.
    subLine: `${TRIAL_DAYS} days free, then ${usd(skuTotal("pro_monthly"))}`,
    description:
      "Full Pro access — a daily digest, match scores, the application tracker and follow-ups.",
    cta: `Start ${TRIAL_DAYS}-day free`,
    ctaMain: false,
    disclosure: `${TRIAL_DAYS} days free, then ${renewalPhrase("pro_monthly")} until cancelled`,
    badge: null,
    badgeInTitle: false,
    glow: "neutral",
    innerGap: 24,
    choice: { sku: "pro_monthly", trial: true },
  },
  {
    key: "pro_3month",
    band: "MOST POPULAR",
    bandTone: "popular",
    tint: "var(--plan-tint-popular)",
    name: "Pro · 3 months",
    price: usd(perMonth("pro_3month")),
    suffix: "/month",
    subLine: `${usd(skuTotal("pro_3month"))} billed today`,
    description: `Everything in Pro, prepaid for ${SKUS.pro_3month.months} months at a lower rate.`,
    cta: "Get 3 months",
    ctaMain: true,
    disclosure: `Charged today. ${renewalPhrase("pro_3month")} until cancelled`,
    badge: savingsBadge("pro_3month", "accent"),
    badgeInTitle: false,
    glow: "accent",
    innerGap: 32,
    choice: { sku: "pro_3month", trial: false },
  },
  {
    key: "pro_6month",
    band: "BEST VALUE",
    bandTone: "best-value",
    tint: "var(--plan-tint-best-value)",
    name: "Pro · 6 months",
    price: usd(perMonth("pro_6month")),
    suffix: "/month",
    subLine: `${usd(skuTotal("pro_6month"))} billed today`,
    description: `Everything in Pro, prepaid for ${SKUS.pro_6month.months} months at our lowest rate.`,
    cta: "Get 6 months",
    ctaMain: true,
    disclosure: `Charged today. ${renewalPhrase("pro_6month")} until cancelled`,
    badge: savingsBadge("pro_6month", "step"),
    badgeInTitle: false,
    glow: "step",
    innerGap: 32,
    choice: { sku: "pro_6month", trial: false },
  },
];

const BAND_COLOR: Record<BandTone, string> = {
  muted: "var(--color-text-secondary)",
  popular: "var(--plan-band-popular)",
  "best-value": "var(--plan-band-best-value)",
};

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
      className="absolute flex items-center"
      style={{
        top: 25,
        right: 25,
        height: 28,
        padding: 2,
        borderRadius: 20,
        background: "rgba(0,0,0,0.08)",
        zIndex: 3,
      }}
    >
      <span
        aria-hidden="true"
        className="absolute transition-[left] duration-200 ease-out motion-reduce:transition-none"
        style={{
          top: 2,
          left: value === "annual" ? 65 : 2,
          height: 24,
          width: 63,
          borderRadius: 20,
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.1)",
        }}
      />
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.id)}
            className="relative"
            style={{
              width: o.id === "annual" ? 56 : 63,
              marginLeft: o.id === "annual" ? -2 : 0,
              padding: "2px 8px",
              fontFamily: "var(--font-sans)",
              fontWeight: 400,
              fontSize: 12,
              lineHeight: "20px",
              color: active ? "var(--color-foreground)" : "var(--color-text-secondary)",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function SavingsBadge({
  badge,
  inTitle,
}: {
  badge: NonNullable<PlanCardSpec["badge"]>;
  inTitle?: boolean;
}) {
  return (
    <span
      className={inTitle ? "" : "absolute"}
      style={{
        top: inTitle ? undefined : 25,
        right: inTitle ? undefined : 21.5,
        padding: "4px 12px",
        borderRadius: 16,
        background: badge.background,
        color: badge.color,
        fontFamily: "var(--font-sans)",
        fontWeight: 400,
        fontSize: 13,
        lineHeight: "20px",
        whiteSpace: "nowrap",
        zIndex: 3,
      }}
    >
      {badge.label}
    </span>
  );
}

export function PlanCard({
  card,
  onSelect,
  switcher,
}: {
  card: PlanCardSpec;
  onSelect: (card: PlanCardSpec) => void;
  switcher?: React.ReactNode;
}) {
  return (
    <div
      className="relative z-0 flex w-full min-w-0 flex-col"
      style={{
        borderRadius: 24,
        background: card.tint,
        // The button block bottom-aligns so the CTA starts at y=253 inside the
        // inner card on all four.
        height: 405,
      }}
    >
      {/* Continuous 1px outline. An overlay above band + inner card, so the
          inner card cannot paint over the sides or bottom of the ring. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          inset: 0,
          border: "1px solid rgba(0,0,0,0.1)",
          borderRadius: 24,
          zIndex: 4,
        }}
      />

      {/* Header band */}
      <div
        className="flex w-full items-center justify-center"
        style={{ padding: "10px 16px 4px" }}
      >
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 500,
            fontSize: 13,
            lineHeight: "20px",
            color: BAND_COLOR[card.bandTone],
            whiteSpace: "nowrap",
          }}
        >
          {card.band}
        </span>
      </div>

      {/* Inner card */}
      <div
        className="relative flex w-full flex-col"
        style={{
          background: "var(--color-surface-1)",
          borderRadius: 20,
          padding: 20,
          gap: card.innerGap,
          flex: "1 1 auto",
          overflow: "hidden",
          isolation: "isolate",
        }}
      >
        {(
          <span
            aria-hidden="true"
            className="pricing-paid-glow"
            style={{
              position: "absolute",
              top: -79,
              right: -78.5,
              width: 200,
              height: 200,
              background:
                card.glow === "accent"
                  ? "radial-gradient(circle, var(--main-accent) 0%, rgba(44,255,142,0) 70%)"
                  : card.glow === "step"
                    ? "radial-gradient(circle, var(--step-accent) 0%, rgba(130,81,225,0) 70%)"
                    : "radial-gradient(circle, rgba(103,120,124,0.5) 0%, rgba(103,120,124,0) 70%)",
              filter: "blur(40px)",
              opacity: 0.5,
              zIndex: 1,
              pointerEvents: "none",
            }}
          />
        )}

        {switcher ?? null}
        {card.badge && !card.badgeInTitle ? <SavingsBadge badge={card.badge} /> : null}

        <div className="relative flex flex-col" style={{ padding: 4, gap: 20, zIndex: 2 }}>
          <div className="flex items-start justify-between">
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                fontSize: 14,
                lineHeight: "28px",
                color: "var(--color-foreground)",
              }}
            >
              {card.name}
            </div>
            {card.badge && card.badgeInTitle ? (
              <SavingsBadge badge={card.badge} inTitle />
            ) : null}
          </div>

          <div className="flex flex-col" style={{ gap: 16 }}>
            <div className="flex flex-col" style={{ gap: 8 }}>
              <div className="flex items-end" style={{ gap: 4 }}>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 400,
                    fontSize: 30,
                    lineHeight: 1.1,
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
                    lineHeight: "22px",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {card.suffix}
                </span>
              </div>
              <div
                style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: 300,
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: "var(--color-text-secondary)",
                }}
              >
                {card.subLine}
              </div>
            </div>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 300,
                fontSize: 14,
                lineHeight: 1.6,
                color: "var(--color-foreground)",
              }}
            >
              {card.description}
            </p>
          </div>
        </div>

        {/* Button + disclosure sit at a fixed offset from the bottom so the CTA
            starts at y=253 inside the 371-tall inner card on every card. */}
        <div
          className="absolute flex flex-col"
          style={{ left: 20, right: 20, bottom: 20, gap: 16, zIndex: 2 }}
        >
        <button
          type="button"
          onClick={() => onSelect(card)}
          className={`relative h-[50px] ${
            card.ctaMain
              ? "main_accent_button main_accent_button--on-light main_accent_button--block"
              : "secondary_button secondary_button--on-light secondary_button--block"
          }`}
          style={{ zIndex: 2 }}
        >
          {card.cta}
        </button>


        <p
          className="relative text-center"
          style={{
            zIndex: 2,
            padding: "0 4px",
            fontFamily: "var(--font-sans)",
            fontWeight: 200,
            fontSize: 12,
            lineHeight: "16px",
            color: "var(--color-text-muted)",
          }}
        >
          {card.disclosure}
        </p>
        </div>
      </div>
    </div>
  );
}

export function PlanCardsGrid({ onSelect }: { onSelect: (card: PlanCardSpec) => void }) {
  // Local to the Watch card only.
  const [watchPeriod, setWatchPeriod] = useState<"monthly" | "annual">("monthly");
  const watch = watchCard(watchPeriod === "annual" ? "watch_annual" : "watch_monthly");

  return (
    <div className="flex w-full flex-col items-center gap-10">
      <div className="flex w-full flex-wrap items-start justify-center" style={{ gap: 20 }}>
        <PlanCard
          card={watch}
          onSelect={onSelect}
          switcher={<WatchPeriodSwitch value={watchPeriod} onChange={setWatchPeriod} />}
        />
        {PRO_CARDS.map((card) => (
          <PlanCard key={card.key} card={card} onSelect={onSelect} />
        ))}
      </div>
      {/* One shared line under all four: cancellation path, the pre-charge email
          promise and the currency. It never replaces a card's own disclosure. */}
      <p
        className="text-center"
        style={{
          maxWidth: 560,
          fontFamily: "var(--font-sans)",
          fontWeight: 200,
          fontSize: 13,
          lineHeight: "24px",
          color: "var(--color-text-secondary)",
        }}
      >
        {SHARED_PLAN_DISCLOSURE}
      </p>
    </div>
  );
}
