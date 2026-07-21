import { Link, useNavigate } from "@tanstack/react-router";
import { IconLogout as LogOut, IconMenu2 as Menu, IconX as X } from "@tabler/icons-react";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`text-green ${className}`}
      style={{ fontFamily: "'Stack Sans Notch', sans-serif", fontSize: 30, fontWeight: 700, letterSpacing: "-0.03em" }}
    >
      jobly
    </span>
  );
}

type NavItem =
  | { label: string; to: string; href?: never }
  | { label: string; href: string; to?: never };

const NAV: NavItem[] = [
  { label: "Offer", href: "/#offer" },
  { label: "Problem", href: "/#problem" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Blog", to: "/blog" },
  { label: "Contact", to: "/contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <header className="sticky top-0 z-[1100] border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-1)]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 md:px-8">
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center">
            <Wordmark />
          </Link>
          <nav className="hidden items-center gap-6 lg:flex">
            {NAV.map((n) =>
              n.to ? (
                <Link
                  key={n.label}
                  to={n.to}
                  className="text-sm text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-foreground)]"
                  activeProps={{ className: "text-sm text-[color:var(--color-foreground)]" }}
                >
                  {n.label}
                </Link>
              ) : (
                <a
                  key={n.label}
                  href={n.href}
                  className="text-sm text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-foreground)]"
                >
                  {n.label}
                </a>
              )
            )}
          </nav>
        </div>
        <div className="hidden items-center gap-6 lg:flex">
          {loading ? null : user ? (
            <>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 text-sm text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-foreground)]"
              >
                <LogOut size={14} /> Sign out
              </button>
              <Link
                to="/dashboard"
                className="inline-flex h-10 items-center rounded-button border border-[color:var(--color-border)] px-4 text-sm text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-foreground)]"
              >
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-foreground)]"
              >
                Log in
              </Link>
              <Link
                to="/quiz"
                className="inline-flex h-10 items-center rounded-button bg-[color:var(--color-accent)] px-4 text-sm text-[color:var(--color-on-accent)] transition-colors hover:bg-[color:var(--color-accent-hover)]"
              >
                Get started
              </Link>
            </>
          )}
        </div>
        <button
          type="button"
          aria-label="Toggle menu"
          className="inline-flex h-11 w-11 items-center justify-center rounded-button border border-[color:var(--color-border)] lg:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
      {open && (
        <div className="border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] lg:hidden">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-1 px-5 py-4">
            {NAV.map((n) =>
              n.to ? (
                <Link
                  key={n.label}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]"
                >
                  {n.label}
                </Link>
              ) : (
                <a
                  key={n.label}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]"
                >
                  {n.label}
                </a>
              )
            )}
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm">
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    void handleSignOut();
                  }}
                  className="mt-2 inline-flex h-11 items-center justify-center rounded-button border border-[color:var(--color-border)] px-4 text-sm"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm">
                  Log in
                </Link>
                <Link
                  to="/quiz"
                  onClick={() => setOpen(false)}
                  className="mt-2 inline-flex h-11 items-center justify-center rounded-button bg-[color:var(--color-accent)] px-4 text-sm text-[color:var(--color-on-accent)]"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}