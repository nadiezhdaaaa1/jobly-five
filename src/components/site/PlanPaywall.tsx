// The A-ha screen paywall: one five-way segmented switcher and ONE expanded
// two-column card for the selected SKU. Presentation only — every price,
// total, percentage, interval and disclosure comes from @/config/pricing, and
// every band label, tint, badge, CTA label, description and bullet comes from
// @/components/site/planSpecs, which the landing grid also reads.

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { IconCheck } from "@tabler/icons-react";

import { SHARED_PLAN_DISCLOSURE, type SkuId } from "@/config/pricing";
import {
  BAND_COLOR,
  PAYWALL_DEFAULT_SKU,
  PAYWALL_SKU_ORDER,
  PLAN_FEATURES,
  SKU_SWITCHER_LABEL,
  billedTodayLine,
  planSpec,
  type PlanCardSpec,
} from "@/components/site/planSpecs";

/** The pill tracks the active segment's measured box — never a fixed width. */
function SkuSwitcher({
  value,
  onChange,
}: {
  value: SkuId;
  onChange: (sku: SkuId) => void;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const segRefs = useRef<Partial<Record<SkuId, HTMLButtonElement | null>>>({});
  const [pill, setPill] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  const measure = useCallback(() => {
    const el = segRefs.current[value];
    if (!el) return;
    setPill({
      left: el.offsetLeft,
      top: el.offsetTop,
      width: el.offsetWidth,
      height: el.offsetHeight,
    });
  }, [value]);

  useLayoutEffect(() => {
    measure();
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(track);
    return () => ro.disconnect();
  }, [measure]);


  return (
    <div
      ref={trackRef}
      role="group"
      aria-label="Choose a plan"
      className="relative inline-flex flex-wrap items-center"
      style={{ padding: 4, borderRadius: 20, background: "rgba(0,0,0,0.08)" }}
    >
      {pill ? (
        <span
          aria-hidden="true"
          className="absolute transition-[left,top,width,height] duration-200 ease-out motion-reduce:transition-none"
          style={{
            top: pill.top,
            left: pill.left,
            width: pill.width,
            height: pill.height,

            borderRadius: 20,
            background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.1)",
          }}
        />
      ) : null}

      {PAYWALL_SKU_ORDER.map((sku, i) => {
        const active = sku === value;
        return (
          <button
            key={sku}
            ref={(el) => {
              segRefs.current[sku] = el;
            }}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(sku)}
            className="relative whitespace-nowrap"
            style={{
              marginRight: i === PAYWALL_SKU_ORDER.length - 1 ? 0 : -2,
              padding: "4px 12px",
              fontFamily: "var(--font-sans)",
              fontWeight: 400,
              fontSize: 14,
              lineHeight: "24px",
              color: active ? "var(--color-foreground)" : "var(--color-text-secondary)",
            }}
          >
            {SKU_SWITCHER_LABEL[sku]}
          </button>
        );
      })}
    </div>
  );
}

function PaywallCard({
  sku,
  spec,
  onSelect,
}: {
  sku: SkuId;
  spec: PlanCardSpec;
  onSelect: (card: PlanCardSpec) => void;
}) {
  return (
    <div
      className="relative w-full"
      style={{
        background: spec.tint,
        borderRadius: 24,
        // The 1px rule is an overlay ring (below), not a border on this box: a
        // border would give the wrapper a 23px padding-box curve while the inner
        // card curves at 24, and the tint would leak at the bottom corners.
        // With no border the two curves coincide exactly. `overflow: hidden`
        // matches the design's `overflow-clip` on 434:5121.
        overflow: "hidden",
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          inset: 0,
          border: "1px solid rgba(0,0,0,0.15)",
          borderRadius: 24,
          zIndex: 4,
        }}
      />



      {/* Band row */}
      <div
        className="flex items-center justify-between gap-3"
        style={{ padding: "12px 20px 8px" }}
      >
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 500,
            fontSize: 13,
            lineHeight: "20px",
            color: BAND_COLOR[spec.bandTone],
          }}
        >
          {spec.band}
        </span>
        {spec.savings ? (
          <span
            style={{
              padding: "4px 12px",
              borderRadius: 16,
              background: spec.savings.background,
              color: spec.savings.color,
              fontFamily: "var(--font-sans)",
              fontWeight: 400,
              fontSize: 13,
              lineHeight: "20px",
              whiteSpace: "nowrap",
            }}
          >
            {spec.savings.label}
          </span>
        ) : null}
      </div>

      {/* Inner card */}
      <div
        className="relative flex w-full flex-col"
        style={{
          background: "var(--color-surface-1)",
          borderRadius: 24,
          padding: 20,
          gap: 16,
          overflow: "hidden",
          isolation: "isolate",
        }}
      >
        {spec.glow !== "none" ? (
          <span
            aria-hidden="true"
            className="pricing-paid-glow"
            style={{
              position: "absolute",
              right: -80,
              top: -80,
              width: 200,
              height: 200,
              background:
                spec.glow === "accent"
                  ? "radial-gradient(circle, var(--main-accent) 0%, rgba(44,255,142,0) 70%)"
                  : "radial-gradient(circle, var(--step-accent) 0%, rgba(130,81,225,0) 70%)",
              filter: "blur(40px)",
              opacity: 0.28,
              zIndex: 1,
              pointerEvents: "none",
            }}
          />
        ) : null}

        {/* Two columns */}
        <div className="relative flex items-stretch" style={{ gap: 40, zIndex: 2 }}>
          <div className="flex min-w-0 flex-1 flex-col" style={{ gap: 8 }}>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 400,
                fontSize: 18,
                lineHeight: "24px",
                color: "var(--color-foreground)",
              }}
            >
              {SKU_SWITCHER_LABEL[sku]}
            </div>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 200,
                fontSize: 14,
                lineHeight: 1.6,
                color: "var(--color-foreground)",
              }}
            >
              {spec.description}
            </p>
            <ul className="flex flex-col" style={{ gap: 8, marginTop: 8 }}>
              {PLAN_FEATURES[sku].map((f) => (
                <li key={f} className="flex items-start" style={{ gap: 8 }}>
                  <IconCheck
                    size={16}
                    strokeWidth={2}
                    className="mt-[3px] shrink-0"
                    style={{ color: "var(--color-green)" }}
                    aria-hidden="true"
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: 200,
                      fontSize: 14,
                      lineHeight: 1.4,
                      color: "var(--color-foreground)",
                    }}
                  >
                    {f}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div
            aria-hidden="true"
            style={{ width: 1, alignSelf: "stretch", background: "var(--color-border)" }}
          />

          <div
            className="flex shrink-0 flex-col items-center justify-center text-center"
            style={{ width: 200, gap: 8 }}
          >
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
                {spec.price}
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
                {spec.suffix}
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
              {billedTodayLine(sku)}
            </div>
          </div>
        </div>

        {/* Footer row */}
        <div className="relative flex items-center" style={{ gap: 16, zIndex: 2 }}>
          <p
            className="flex-1"
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 200,
              fontSize: 12,
              lineHeight: "16px",
              color: "var(--color-text-muted)",
            }}
          >
            {spec.disclosure}
          </p>
          <button
            type="button"
            onClick={() => onSelect(spec)}
            className={
              (spec.ctaMain
                ? "main_accent_button main_accent_button--on-light main_accent_button--block"
                : "secondary_button secondary_button--on-light secondary_button--block") +
              " h-[48px] shrink-0"
            }

            style={{ width: 200 }}
          >
            {spec.cta}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PlanPaywall({ onSelect }: { onSelect: (card: PlanCardSpec) => void }) {
  const [sku, setSku] = useState<SkuId>(PAYWALL_DEFAULT_SKU);
  const spec = planSpec(sku);

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="flex w-full flex-col items-start gap-4">
        <SkuSwitcher value={sku} onChange={setSku} />
        <PaywallCard sku={sku} spec={spec} onSelect={onSelect} />
      </div>

      {/* The one shared line: cancellation path, pre-charge email promise and
          currency. It never replaces a SKU's own disclosure. */}
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
