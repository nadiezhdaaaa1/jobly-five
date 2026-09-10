import { Link, useNavigate } from "@tanstack/react-router";
import { IconMenu2 as Menu, IconX as X } from "@tabler/icons-react";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Wordmark } from "./Wordmark";

export { Wordmark };

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

export function Header({ overlay = false }: { overlay?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!overlay) return;
    let raf = 0;
    const read = () => setScrolled(window.scrollY > 8);
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        read();
      });
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [overlay]);

  const isOverlay = overlay && !scrolled;

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  const linkClass = "text-[14px] font-light leading-5 text-current transition-opacity hover:opacity-70";

  return (
    <header
      className={`site-header z-[1100] ${overlay ? "fixed left-0 right-0 top-0" : "sticky top-0"}`}
      style={
        isOverlay
          ? { backgroundColor: "transparent", color: "#FFFFFF", borderBottom: "1px solid transparent" }
          : {
              backgroundColor: "var(--color-surface-1)",
              color: "var(--color-foreground)",
              borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
            }
      }
    >
      <div
        className={`site-header-bar mx-auto flex max-w-[1200px] items-center justify-between px-5 md:px-8 ${
          isOverlay ? "h-20" : "h-[72px]"
        }`}
      >
        <div className="flex items-center gap-10">
          <Link to="/" aria-label="Jobly home" className="flex items-center">
            <Wordmark className="!text-current" />
          </Link>
          <nav className="hidden items-center gap-6 lg:flex">
            {NAV.map((n) =>
              n.to ? (
                <Link key={n.label} to={n.to} className={linkClass}>
                  {n.label}
                </Link>
              ) : (
                <a key={n.label} href={n.href} className={linkClass}>
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
                className={`secondary_button secondary_button--sm${
                  isOverlay ? "" : " secondary_button--on-light"
                }`}
              >
                Sign out
              </button>
              <Link
                to="/dashboard"
                className={`main_accent_button main_accent_button--sm${
                  isOverlay ? "" : " main_accent_button--on-light"
                }`}
              >
                Digest
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className={linkClass}>
                Log in
              </Link>
              <Link
                to="/quiz"
                className={`main_accent_button main_accent_button--sm${
                  isOverlay ? "" : " main_accent_button--on-light"
                }`}
              >
                Get started
              </Link>
            </>
          )}
        </div>
        {/* Visibility lives on this wrapper, not on the button: the button
            classes set `display` themselves in unlayered CSS, so an
            `lg:hidden` utility on the button loses the cascade and the burger
            would show on desktop. */}
        <div className="lg:hidden">
          <button
            type="button"
            aria-label="Toggle menu"
            className={`secondary_button secondary_button--icon${
              isOverlay ? "" : " secondary_button--on-light"
            }`}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] text-[color:var(--color-foreground)] lg:hidden">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-1 px-5 py-4">
            {NAV.map((n) =>
              n.to ? (
                <Link
                  key={n.label}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="rounded-[12px] px-3 py-3 text-base text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]"
                >
                  {n.label}
                </Link>
              ) : (
                <a
                  key={n.label}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="rounded-[12px] px-3 py-3 text-base text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]"
                >
                  {n.label}
                </a>
              )
            )}
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="rounded-[12px] px-3 py-3 text-base text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]">
                  Digest
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    void handleSignOut();
                  }}
                  className="mt-2 inline-flex h-11 items-center justify-center rounded-[14px] border border-[color:var(--color-border)] px-4 text-sm"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="rounded-[12px] px-3 py-3 text-base text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]">
                  Log in
                </Link>
                <Link
                  to="/quiz"
                  onClick={() => setOpen(false)}
                  className="main_accent_button mt-2 justify-center"
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