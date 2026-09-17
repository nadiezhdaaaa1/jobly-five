import { Link } from "@tanstack/react-router";
import { IconBriefcase2, IconTarget, IconUserSquare, IconSettings } from "@tabler/icons-react";
import { usePlan, isPro, useEntitlementsReady } from "@/lib/plan-store";
import proCubeAsset from "@/assets/pro2.png.asset.json";
import { Wordmark } from "@/components/site/Wordmark";

export type AppTab = "digest" | "tracker" | "resume" | "profile" | "settings";

const TABS: Array<{ key: AppTab; label: string; icon: typeof IconBriefcase2; to: string }> = [
  { key: "digest", label: "Digest", icon: IconBriefcase2, to: "/dashboard" },
  { key: "tracker", label: "Tracker", icon: IconTarget, to: "/tracker" },
  { key: "profile", label: "Profile", icon: IconUserSquare, to: "/profile" },
  { key: "settings", label: "Settings", icon: IconSettings, to: "/settings" },
];

export function AppHeader({ active, hasNewDigest = true }: { active: AppTab; hasNewDigest?: boolean }) {
  const plan = usePlan();
  const planReady = useEntitlementsReady();
  const pro = isPro(plan);
  // The badge names the plan state; a pause grants nothing but is still shown.
  const badge = plan === "free" ? null : plan === "paused" ? "Paused" : plan === "watch" ? "Watch" : "Pro";
  return (
    <header className="sticky top-0 z-40 h-14 border-b bg-[color:var(--color-surface-1)]">
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-6">
        <div className="flex items-center gap-5">
        <Link to="/dashboard" aria-label="Jobly dashboard" className="flex items-center gap-3">
          <Wordmark className="!text-current" />
          {!planReady ? (
            <span
              aria-label="Loading your plan"
              className="inline-flex h-[26px] w-[52px] rounded-[12px] skeleton"
            />
          ) : badge ? (
            <span className="inline-flex items-center rounded-[12px] bg-[color:var(--color-mint)] px-2.5 py-1 text-[13px] font-semibold text-[color:var(--color-green)]">
              {badge}
            </span>
          ) : null}
        </Link>
        {planReady && !badge ? (
          <Link
            to="/settings"
            /* Design-system accent button. The class ships radius 14; at a
               measured 36px height the ladder says 12, so it is overridden
               inline (the class is unlayered, so inline wins). */
            className="group hidden md:inline-flex relative w-[132px] items-center overflow-hidden main_accent_button main_accent_button--on-light button-small"
            style={{ borderRadius: 12, height: 36, fontSize: 14, padding: "0 52px 0 16px" }}
          >
            <span>Go Pro</span>
            <img
              src={proCubeAsset.url}
              alt=""
              aria-hidden
              className="pointer-events-none absolute right-0 top-1/2 h-9 w-auto -translate-y-1/2 transition-transform duration-200 ease-out group-hover:translate-x-1"
            />
          </Link>
        ) : null}
        </div>
        <nav className="hidden md:flex items-end gap-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = t.key === active;
            const showDot = t.key === "digest" && hasNewDigest && !isActive;
            return (
              <Link
                key={t.key}
                to={t.to}
                className={`relative flex h-14 w-[76px] flex-col items-center justify-center gap-1 border-b-2 ${isActive ? "border-[color:var(--color-foreground)] text-[color:var(--color-foreground)]" : "border-transparent text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-secondary)]"}`}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="relative">
                  <Icon size={19} strokeWidth={1.6} />
                </span>
                <span className="text-[11px] leading-none">{t.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export function MobileTabBar({ active, hasNewDigest = true }: { active: AppTab; hasNewDigest?: boolean }) {
  return (
    <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t bg-[color:var(--color-surface-1)]">
      <div className="mx-auto grid max-w-[1200px] grid-cols-4">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = t.key === active;
          const showDot = t.key === "digest" && hasNewDigest && !isActive;
          return (
            <Link
              key={t.key}
              to={t.to}
              className={`relative flex h-[68px] flex-col items-center justify-center gap-1.5 border-t-2 pb-1 ${isActive ? "border-[color:var(--color-foreground)] text-[color:var(--color-foreground)]" : "border-transparent text-[color:var(--color-text-muted)]"}`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={24} strokeWidth={1.6} />
              <span className="text-[12px] leading-none">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}