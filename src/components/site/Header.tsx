import { Link, useNavigate } from "@tanstack/react-router";
import { IconLogout as LogOut, IconMenu2 as Menu, IconX as X } from "@tabler/icons-react";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 71.1026 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`text-green h-8 w-auto ${className}`}
    >
      <path d="M61.0137 13.8662C61.2615 14.3995 61.4745 14.8886 61.6514 15.333C61.8461 15.7597 62.0051 16.178 62.129 16.5869C62.2706 16.178 62.4392 15.7597 62.6339 15.333C62.8285 14.8887 63.0589 14.3994 63.3243 13.8662L66.1915 8H71.1026L59.2618 32H54.2969L59.6075 21.2803L54.8067 11.4785L55.1368 8H58.2003L61.0137 13.8662Z" fill="currentColor" />
      <path d="M47.6975 24L49.9717 0H54.6975L52.4232 24H47.6975Z" fill="currentColor" />
      <path d="M35.3195 8.99805C35.4509 8.93234 35.5842 8.86921 35.7199 8.80957C36.1989 8.48822 36.7207 8.23091 37.2854 8.03809C38.0114 7.79017 38.7996 7.66604 39.6496 7.66602C41.1372 7.66602 42.4834 8.04711 43.6877 8.80859C44.8919 9.55238 45.8484 10.5619 46.5568 11.8369C47.2829 13.1119 47.6456 14.52 47.6457 16.0605C47.6457 17.6013 47.2829 19.01 46.5568 20.2852C45.8484 21.5425 44.8919 22.552 43.6877 23.3135C43.1401 23.6598 42.5625 23.9254 41.9562 24.1143C41.0688 24.4272 40.1256 24.5859 39.1252 24.5859C37.9623 24.5859 36.8756 24.374 35.8654 23.9512C35.4507 23.7727 35.0569 23.5659 34.6818 23.334V24H30.6975V0H35.3195V8.99805ZM39.1184 11.7305C38.3392 11.7305 37.6309 11.9258 36.9934 12.3154C36.3558 12.705 35.842 13.2276 35.4523 13.8828C35.0806 14.5379 34.8948 15.2639 34.8947 16.0605C34.8947 16.8574 35.0805 17.584 35.4523 18.2393C35.842 18.8945 36.3558 19.417 36.9934 19.8066C37.6309 20.1962 38.3392 20.3906 39.1184 20.3906C39.8975 20.3906 40.6059 20.1962 41.2434 19.8066C41.8809 19.417 42.3861 18.8945 42.758 18.2393C43.1476 17.584 43.342 16.8575 43.342 16.0605C43.3419 15.2638 43.1475 14.5379 42.758 13.8828C42.3861 13.2275 41.8809 12.705 41.2434 12.3154C40.6059 11.9259 39.8975 11.7305 39.1184 11.7305Z" fill="currentColor" />
      <path d="M4.97989 24.6221C4.0567 24.6221 3.14239 24.48 2.23696 24.196C1.34928 23.9119 0.603623 23.4681 0 22.8645L1.25163 18.3906C1.6067 18.9232 2.05942 19.3492 2.60978 19.6688C3.16015 19.9884 3.78152 20.1482 4.47391 20.1482C5.30833 20.1482 6.00072 19.873 6.55109 19.3226C7.1192 18.7723 7.40326 17.8491 7.40326 16.5531V0.12207H12.3565V16.8992C12.3565 18.6746 12.0103 20.1393 11.3179 21.2933C10.6255 22.4295 9.71123 23.2728 8.575 23.8232C7.45652 24.3558 6.25815 24.6221 4.97989 24.6221Z" fill="currentColor" />
      <path d="M25.7973 16.0996C25.7973 13.7248 23.8723 11.7998 21.4975 11.7998C19.1226 11.7998 17.1977 13.7248 17.1977 16.0996C17.1977 18.4744 19.1226 20.3994 21.4975 20.3994V24.5996C16.803 24.5996 12.9975 20.794 12.9975 16.0996C12.9975 11.4052 16.803 7.59961 21.4975 7.59961C26.1919 7.59961 29.9975 11.4052 29.9975 16.0996C29.9975 20.794 26.1919 24.5996 21.4975 24.5996V20.3994C23.8723 20.3994 25.7973 18.4744 25.7973 16.0996Z" fill="currentColor" />
    </svg>
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
              <button type="button" onClick={handleSignOut} className={`inline-flex items-center gap-2 ${linkClass}`}>
                <LogOut size={14} /> Sign out
              </button>
              <Link
                to="/dashboard"
                className="inline-flex h-10 items-center rounded-button border border-current px-4 text-[14px] font-light leading-5 text-current transition-opacity hover:opacity-70"
              >
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className={linkClass}>
                Log in
              </Link>
              <Link to="/quiz" className="main_accent_button main_accent_button--sm">
                Get started
              </Link>
            </>
          )}
        </div>
        <button
          type="button"
          aria-label="Toggle menu"
          className="inline-flex h-11 w-11 items-center justify-center rounded-button border border-current text-current lg:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
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
                  className="rounded-[4px] px-3 py-3 text-sm text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]"
                >
                  {n.label}
                </Link>
              ) : (
                <a
                  key={n.label}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="rounded-[4px] px-3 py-3 text-sm text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]"
                >
                  {n.label}
                </a>
              )
            )}
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="rounded-[4px] px-3 py-3 text-sm">
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
                <Link to="/login" onClick={() => setOpen(false)} className="rounded-[4px] px-3 py-3 text-sm">
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