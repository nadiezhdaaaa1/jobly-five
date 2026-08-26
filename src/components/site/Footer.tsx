import { Link } from "@tanstack/react-router";
import { Wordmark } from "./Header";
import { VS_PAGES } from "@/lib/vs-data";
import fbIcon from "@/assets/social/fb.svg";
import inIcon from "@/assets/social/in.svg";
import xIcon from "@/assets/social/twitter-x.svg";
import instaIcon from "@/assets/social/insta.svg";
import ytIcon from "@/assets/social/yt.svg";
import tikIcon from "@/assets/social/tik.svg";
import redditIcon from "@/assets/social/reddit.svg";
import pinterestIcon from "@/assets/social/pinterest.svg";

const SOCIALS: { label: string; href: string; icon: string }[] = [
  { label: "LinkedIn", href: "https://linkedin.com", icon: inIcon },
  { label: "X (Twitter)", href: "https://x.com", icon: xIcon },
  { label: "Instagram", href: "https://instagram.com", icon: instaIcon },
  { label: "Facebook", href: "https://facebook.com", icon: fbIcon },
  { label: "YouTube", href: "https://youtube.com", icon: ytIcon },
  { label: "TikTok", href: "https://tiktok.com", icon: tikIcon },
  { label: "Reddit", href: "https://reddit.com", icon: redditIcon },
  { label: "Pinterest", href: "https://pinterest.com", icon: pinterestIcon },
];

type FooterLink = { label: string; to?: string; href?: string };

const COLS: { title: string; items: FooterLink[] }[] = [
  {

    title: "Company",
    items: [
      { label: "Blog", to: "/blog" },
      { label: "RSS feed", href: "/blog/rss.xml" },
      { label: "Contact", to: "/contact" },
    ],
  },
  {
    title: "Legal",
    items: [
      { label: "Terms of Service", to: "/legal/terms" },
      { label: "Privacy Policy", to: "/legal/privacy" },
      { label: "Subscription and Billing", to: "/legal/billing" },
      { label: "Cookie Policy", to: "/legal/cookies" },
      { label: "Refund Policy", to: "/legal/refund" },
      { label: "Email Consent", to: "/legal/email" },
      { label: "Disclaimer", to: "/legal/disclaimer" },
     { label: "DMCA Policy", to: "/legal/dmca" },
    ],
  },
  {
    title: "Guides",
    items: [
      { label: "Ghost jobs", to: "/guides/ghost-jobs" },
      { label: "AI job matching", to: "/guides/ai-job-matching" },
      { label: "Job alerts", to: "/guides/job-alerts" },
      { label: "All guides", to: "/guides" },
    ],
  },
  {
    title: "Compare",
    items: VS_PAGES.map((p) => ({ label: p.footerLabel, to: `/vs/${p.slug}` })),
  },
];

export function Footer() {
  return (
    <footer className="bg-[color:var(--color-background)]">
      <div className="border-[color:var(--color-border)] lg:mx-12 lg:border-l lg:border-r">
      <div className="mx-auto max-w-[1200px] px-5 pt-24 pb-14 md:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_minmax(0,3fr)]">
          <div>
            <Wordmark className="!text-[color:var(--color-text-muted)]" />
            <p className="mt-3 max-w-xs text-sm text-[color:var(--color-text-secondary)]">
              Email-first job discovery platform
            </p>
            <ul className="mt-4 flex flex-wrap items-center gap-3">
              {SOCIALS.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="inline-flex h-8 w-8 items-center justify-center transition-opacity hover:opacity-70"
                  >
                    <img src={s.icon} alt="" width={20} height={20} />
                  </a>
                </li>
              ))}
            </ul>
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
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-2 md:grid-cols-4 md:gap-8 xl:gap-12">
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
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-[color:var(--color-border)] pt-12 text-xs text-[color:var(--color-text-muted)] md:flex-row md:items-center">
          <span>© 2025 Jobly. All rights reserved.</span>
          <span>You can adjust or turn off daily match frequencies anytime via your settings link.</span>
        </div>
      </div>
      </div>
    </footer>
  );
}