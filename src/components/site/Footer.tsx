import { Link } from "@tanstack/react-router";
import { Wordmark } from "./Header";
import { LEGAL_DOCS, LEGAL_ORDER } from "@/lib/legal-data";
import { VS_INDEX, getVsPage } from "@/lib/vs-data";
import { FEATURE_PAGES } from "@/lib/features-data";
import { TOOL_PAGES } from "@/lib/tools-data";

import fbIcon from "@/assets/social/fb.svg";
import inIcon from "@/assets/social/in.svg";
import instaIcon from "@/assets/social/insta.svg";
import ytIcon from "@/assets/social/yt.svg";
import tikIcon from "@/assets/social/tik.svg";

// href null = profile not live yet: icon renders without an anchor, at 60% opacity.
const SOCIALS: { label: string; href: string | null; icon: string }[] = [
  { label: "Instagram", href: "https://www.instagram.com/jobly_careers", icon: instaIcon },
  { label: "TikTok", href: "https://www.tiktok.com/@jobly.careers", icon: tikIcon },
  { label: "YouTube", href: "https://www.youtube.com/@jobly.careers", icon: ytIcon },
  { label: "Facebook", href: null, icon: fbIcon },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/joblycareers/", icon: inIcon },
];

type FooterLink = { label: string; to?: string; href?: string };
type FooterGroup = { title: string; items: FooterLink[] };

const COMPANY: FooterGroup = {
  title: "Company",
  items: [
    { label: "Blog", to: "/blog" },
    { label: "RSS feed", href: "/blog/rss.xml" },
    { label: "Contact", to: "/contact" },
  ],
};

const LEGAL: FooterGroup = {
  title: "Legal",
  // Link text is each document's own title, read straight from LEGAL_DOCS, so
  // a policy can never be listed here under a name its page does not carry.
  items: LEGAL_ORDER.map((slug) => ({
    label: LEGAL_DOCS[slug].title,
    to: `/legal/${slug}`,
  })),
};

// TEMPORARY (Sep 2026): three Guides entries are hidden from the footer, not
// deleted. `hidden: true` is the only switch — flip it to `false` (or delete the
// property) on a line below to bring that entry back, one line per entry.
// Do NOT wire this column to `published`: every guide, Ghost jobs included, is
// currently published: false, so that flag would empty the whole column.
const GUIDES: FooterGroup = {
  title: "Guides",
  items: (
    [
      { label: "Ghost jobs", to: "/guides/ghost-jobs" },
      { label: "AI job matching", to: "/guides/ai-job-matching", hidden: true }, // wave 2
      { label: "Job alerts", to: "/guides/job-alerts", hidden: true }, // wave 3
      { label: "All guides", to: "/guides", hidden: true }, // index exists; hidden by request
    ] satisfies (FooterLink & { hidden?: boolean })[]
  ).filter((i) => !i.hidden),
};


const FEATURES: FooterGroup = {
  title: "Features",
  // Same rule as the Legal column: link text comes from each page's own data.
  items: FEATURE_PAGES.map((p) => ({ label: p.footerLabel, to: `/features/${p.slug}` })),
};

const TOOLS: FooterGroup = {
  title: "Tools",
  items: TOOL_PAGES.map((p) => ({ label: p.footerLabel, to: `/tools/${p.slug}` })),
};

const COMPARE: FooterGroup = {
  title: "Compare",
  // LINKED_VS_PAGES is the single source for "which comparisons are linkable":
  // written, existing and published. The article rail reads the same list.
  items: LINKED_VS_PAGES.map((page) => ({
    label: page.footerLabel,
    to: `/vs/${page.slug}`,
  })),
};

const HEADING_CLASS =
  "text-[14px] font-semibold leading-[20px] text-[color:var(--color-foreground)]";
const LINK_CLASS =
  "text-[14px] font-extralight leading-[20px] text-[color:var(--color-text-secondary)] transition-colors hover:text-[color:var(--color-foreground)]";

function LinkGroup({ group }: { group: FooterGroup }) {
  return (
    <div className="flex flex-col items-start">
      <p className={HEADING_CLASS}>{group.title}</p>
      <ul className="flex flex-col items-start pt-3">
        {group.items.map((i, idx) => (
          <li key={i.label} className={idx === 0 ? "" : "pt-2"}>
            {i.to ? (
              <Link to={i.to} className={LINK_CLASS}>
                {i.label}
              </Link>
            ) : (
              <a href={i.href} className={LINK_CLASS}>
                {i.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[color:var(--color-background)] px-0 md:px-12">
      <div className="border-[color:var(--color-border)] md:border-l md:border-r">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-start px-5 pt-14 pb-14 md:px-8 md:pt-24 lg:pt-26">
          {/* Proportional track (~348.73 : 747.27 of the 1200px frame) so the
              block shrinks instead of clipping; collapses below lg. */}
          <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,29.06fr)_minmax(0,62.27fr)]">

            {/* Brand column */}
            <div className="flex flex-col items-start">
              <div className="flex h-[45px] items-center">
                <Wordmark className="!text-[color:var(--color-text-muted)]" />
              </div>
              <p className="max-w-[320px] pt-3 text-[14px] font-extralight leading-[20px] text-[color:var(--color-text-secondary)]">
                Email-first job discovery platform
              </p>
              <ul className="flex items-center gap-3 pt-4">
                {SOCIALS.map((s) => (
                  <li key={s.label}>
                    {s.href ? (
                      <a
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={s.label}
                        className="inline-flex h-8 w-8 items-center justify-center transition-opacity hover:opacity-70"
                      >
                        <img src={s.icon} alt="" width={20} height={20} />
                      </a>
                    ) : (
                      <span
                        role="img"
                        aria-label={`${s.label} — coming soon`}
                        className="inline-flex h-8 w-8 items-center justify-center opacity-60"
                      >
                        <img src={s.icon} alt="" width={20} height={20} />
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="max-w-[320px] pt-4 text-[12px] font-extralight leading-[16px] text-[color:var(--color-text-muted)]">
                NORELIX LIMITED · trading as Jobly
                <br />
                The Black Church, St Mary’s Place,
                <br />
                Dublin 7, D07 P4AX, Ireland
                <br />
                Company No. 817569
              </p>
            </div>

            {/* Links block: four sub-columns */}
            {/* One column on mobile, 2x2 at tablet, four across at desktop. */}
            <div className="grid w-full min-w-0 grid-cols-1 gap-x-4 gap-y-10 md:grid-cols-2 lg:grid-cols-4">
              <div className="min-w-0">
                <LinkGroup group={COMPANY} />
              </div>
              <div className="min-w-0">
                <LinkGroup group={LEGAL} />
              </div>
              <div className="flex min-w-0 flex-col gap-6">
                <LinkGroup group={GUIDES} />
                <LinkGroup group={FEATURES} />
                <LinkGroup group={TOOLS} />
              </div>
              <div className="min-w-0">
                <LinkGroup group={COMPARE} />
              </div>
            </div>

          </div>

          <div className="w-full pt-12">
            <div className="flex flex-col items-start justify-between gap-3 border-t border-[color:var(--color-border)] pt-12 text-[12px] font-extralight leading-[16px] text-[color:var(--color-text-muted)] md:flex-row md:items-center">
              <span>© {year} Jobly. All rights reserved.</span>
              {/* Bottom-right line held pending replacement copy — the Email and
                  Communications Consent doc says cadence follows the plan. */}
              <span>You can adjust or turn off daily match frequencies anytime via your settings link.</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
