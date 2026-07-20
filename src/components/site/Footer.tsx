import { Link } from "@tanstack/react-router";
import { Wordmark } from "./Header";

type FooterLink = { label: string; to?: string; href?: string };

const COLS: { title: string; items: FooterLink[] }[] = [
  {
    title: "Product",
    items: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Get started", to: "/quiz" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "Blog", to: "/blog" },
      { label: "Contact", to: "/contact" },
    ],
  },
  {
    title: "Legal",
    items: [
      { label: "Terms of Service", to: "/legal/terms" },
      { label: "Privacy Policy", to: "/legal/privacy" },
      { label: "Cookie Policy", to: "/legal/cookies" },
      { label: "Refund Policy", to: "/legal/refund" },
      { label: "Disclaimer", to: "/legal/disclaimer" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-[color:var(--color-background)]">
      <div className="mx-auto max-w-[1200px] px-5 py-14 md:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Wordmark />
            <p className="mt-3 max-w-xs text-sm text-[color:var(--color-text-secondary)]">
              Email-first job discovery platform for tech candidates.
            </p>
            <p className="mt-4 max-w-xs text-xs text-[color:var(--color-text-muted)]">
              NORELIX LIMITED · trading as Jobly
              <br />
              The Black Church, St Mary’s Place,
              <br />
              Dublin 7, D07 P4AX, Ireland
              <br />
              Company No. 817569
            </p>
          </div>
          {COLS.map((c) => (
            <div key={c.title}>
              <div className="text-sm font-semibold">{c.title}</div>
              <ul className="mt-3 space-y-2 text-sm text-[color:var(--color-text-secondary)]">
                {c.items.map((i) => (
                  <li key={i.label}>
                    {i.to ? (
                      <Link to={i.to} className="hover:text-[color:var(--color-foreground)]">
                        {i.label}
                      </Link>
                    ) : (
                      <a href={i.href} className="hover:text-[color:var(--color-foreground)]">
                        {i.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-[color:var(--color-border)] pt-6 text-xs text-[color:var(--color-text-muted)] md:flex-row md:items-center">
          <span>© 2025 Jobly. All rights reserved.</span>
          <span>You can adjust or turn off daily match frequencies anytime via your settings link.</span>
        </div>
      </div>
    </footer>
  );
}