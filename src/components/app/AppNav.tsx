import { Link } from "@tanstack/react-router";
import { IconBriefcase2, IconTarget, IconFileDescription, IconUserSquare, IconSettings } from "@tabler/icons-react";
import { usePlan, isPro } from "@/lib/plan-store";
import proCubeAsset from "@/assets/pro2.png.asset.json";

export type AppTab = "digest" | "tracker" | "resume" | "profile" | "settings";

const TABS: Array<{ key: AppTab; label: string; icon: typeof IconBriefcase2; to: string }> = [
  { key: "digest", label: "Digest", icon: IconBriefcase2, to: "/dashboard" },
  { key: "tracker", label: "Tracker", icon: IconTarget, to: "/tracker" },
  { key: "resume", label: "Resume", icon: IconFileDescription, to: "/resume" },
  { key: "profile", label: "Profile", icon: IconUserSquare, to: "/profile" },
  { key: "settings", label: "Settings", icon: IconSettings, to: "/settings" },
];

export function AppHeader({ active, hasNewDigest = true }: { active: AppTab; hasNewDigest?: boolean }) {
  const plan = usePlan();
  const pro = isPro(plan);
  return (
    <header className="sticky top-0 z-40 h-14 border-b bg-[color:var(--color-surface-1)]">
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-6">
        <div className="flex items-center gap-5">
        <Link to="/dashboard" className="flex items-center gap-3">
          <span
            className="leading-none text-[color:var(--color-green)]"
            style={{ fontFamily: "'Stack Sans Notch', sans-serif", fontSize: 30, fontWeight: 700, letterSpacing: "-0.03em" }}
          >
            jobly
          </span>
          {pro ? (
            <span className="inline-flex items-center rounded-[4px] bg-[color:var(--color-mint)] px-2.5 py-1 text-[13px] font-semibold text-[color:var(--color-green)]">
              {plan === "paused" ? "Paused" : "Pro"}
            </span>
          ) : null}
        </Link>
        {!pro ? (
          <Link
            to="/settings"
            className="group hidden md:inline-flex relative h-9 w-[120px] items-center overflow-hidden rounded-[4px] bg-[color:var(--color-accent)] pl-4 pr-14 text-[14px] font-medium text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
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
                  {showDot ? (
                    <span
                      className="absolute -right-1 -top-1 h-[7px] w-[7px] rounded-full bg-[color:var(--color-accent)]"
                      style={{ boxShadow: "0 0 0 1.5px #fff" }}
                      aria-hidden
                    />
                  ) : null}
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
      <div className="mx-auto grid max-w-[1200px] grid-cols-5">
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
              <span className="relative">
                <Icon size={24} strokeWidth={1.6} />
                {showDot ? (
                  <span
                    className="absolute -right-1 -top-1 h-[7px] w-[7px] rounded-full bg-[color:var(--color-accent)]"
                    style={{ boxShadow: "0 0 0 1.5px #fff" }}
                    aria-hidden
                  />
                ) : null}
              </span>
              <span className="text-[12px] leading-none">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}