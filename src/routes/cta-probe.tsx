// TEMPORARY measurement harness — delete after verifying the plan-switch button
// widths. Not linked from anywhere and noindex.
import { createFileRoute } from "@tanstack/react-router";
import { PlanPaywall, type PaywallCta } from "@/components/site/PlanPaywall";
import { SKU_SWITCHER_LABEL } from "@/components/site/planSpecs";
import type { SkuId } from "@/config/pricing";

export const Route = createFileRoute("/cta-probe")({
  head: () => ({
    meta: [{ title: "CTA probe" }, { name: "robots", content: "noindex" }],
  }),
  component: Probe,
});

// Mirrors the Settings ctaOverride for a pro_6month subscriber: Watch · Annual
// is a downgrade, Pro · Monthly an upgrade. The third case is a deliberately
// over-long label, to prove the button can no longer exceed the card.
function overrideFor(currentSku: SkuId, longLabel: boolean) {
  return (sku: SkuId): PaywallCta | null => {
    if (sku === currentSku) return { label: "Cancel plan", main: false };
    const down = sku.startsWith("watch");
    const visible = longLabel
      ? "Switch at the very end of the current paid period"
      : down
        ? "Switch at period end"
        : "Switch now";
    return {
      label: visible,
      ariaLabel: `${visible} to ${SKU_SWITCHER_LABEL[sku]}`,
      main: true,
    };
  };
}

function Probe() {
  return (
    <div className="mx-auto flex max-w-[560px] flex-col gap-10 p-6">
      <div data-probe="real">
        <PlanPaywall
          onSelect={() => undefined}
          initialSku="watch_annual"
          context="manage"
          showSharedDisclosure={false}
          ctaOverride={overrideFor("pro_6month", false)}
        />
      </div>
      <div data-probe="long">
        <PlanPaywall
          onSelect={() => undefined}
          initialSku="watch_annual"
          context="manage"
          showSharedDisclosure={false}
          ctaOverride={overrideFor("pro_6month", true)}
        />
      </div>
    </div>
  );
}
