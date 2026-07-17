import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";

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
  return (
    <header className="sticky top-0 z-[1100] border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-1)]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 md:px-8">
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center">
            <Wordmark />
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.label}
                to={n.to}
                className="text-sm text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-foreground)]"
                activeProps={{ className: "text-sm text-[color:var(--color-foreground)]" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="hidden items-center gap-6 md:flex">
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
        </div>
        <button
          type="button"
          aria-label="Toggle menu"
          className="inline-flex h-11 w-11 items-center justify-center rounded-button border border-[color:var(--color-border)] md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
      {open && (
        <div className="border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] md:hidden">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-1 px-5 py-4">
            {NAV.map((n) => (
              <Link
                key={n.label}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-sm text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]"
              >
                {n.label}
              </Link>
            ))}
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
          </div>
        </div>
      )}
    </header>
  );
}