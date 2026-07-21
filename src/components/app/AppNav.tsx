import { Link } from "@tanstack/react-router";
import { FileText, Kanban, Mail, User as UserIcon } from "lucide-react";

export type AppTab = "digest" | "tracker" | "resume" | "profile";

const TABS: Array<{ key: AppTab; label: string; icon: typeof Mail; to: string }> = [
  { key: "digest", label: "Digest", icon: Mail, to: "/dashboard" },
  { key: "tracker", label: "Tracker", icon: Kanban, to: "/tracker" },
  { key: "resume", label: "Resume", icon: FileText, to: "/resume" },
  { key: "profile", label: "Profile", icon: UserIcon, to: "/profile" },
];

export function AppHeader({ active, hasNewDigest = true }: { active: AppTab; hasNewDigest?: boolean }) {
  return (
    <header className="sticky top-0 z-40 h-14 border-b bg-[color:var(--color-surface-1)]">
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-[20px] font-semibold leading-none text-[color:var(--color-green)]" style={{ fontFamily: "var(--font-logo)" }}>
            jobly
          </span>
          <span className="inline-flex items-center rounded-[4px] bg-[color:var(--color-mint)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--color-green)]">
            Pro
          </span>
        </Link>
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
      <div className="mx-auto grid max-w-[1200px] grid-cols-4">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = t.key === active;
          const showDot = t.key === "digest" && hasNewDigest && !isActive;
          return (
            <Link
              key={t.key}
              to={t.to}
              className={`relative flex h-14 flex-col items-center justify-center gap-1 border-t-2 ${isActive ? "border-[color:var(--color-foreground)] text-[color:var(--color-foreground)]" : "border-transparent text-[color:var(--color-text-muted)]"}`}
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
      </div>
    </nav>
  );
}