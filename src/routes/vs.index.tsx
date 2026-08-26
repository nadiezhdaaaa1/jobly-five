import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "../components/site/Header";
import { Footer } from "../components/site/Footer";
import { CtaBlock } from "../components/site/CtaBlock";
import { VS_PAGES } from "../lib/vs-data";
import { formatDate } from "../lib/blog-data";

const ORIGIN = "https://jobly-five.lovable.app";
const URL = `${ORIGIN}/vs`;

// Placeholder section: nothing here is published yet, so the hub stays noindex.
const PUBLISHED = VS_PAGES.some((p) => p.published);

export const Route = createFileRoute("/vs/")({
  head: () => {
    const title = "Compare Jobly — alternatives and comparisons";
    const description =
      "How Jobly compares to LinkedIn, Indeed, Glassdoor, Teal and other job search tools, feature by feature.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: URL },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        ...(PUBLISHED ? [] : [{ name: "robots", content: "noindex, follow" }]),
      ],
      links: PUBLISHED ? [{ rel: "canonical", href: URL }] : [],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: ORIGIN },
              { "@type": "ListItem", position: 2, name: "Compare", item: URL },
            ],
          }),
        },
      ],
    };
  },
  component: VsIndex,
});

function VsIndex() {
  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <Header />
      <main>
        <section className="mx-auto max-w-[1200px] px-5 pt-12 pb-8 md:px-8 md:pt-16">
          <h1 className="text-3xl leading-tight md:text-4xl">Compare Jobly</h1>
          <p className="mt-3 max-w-[680px] text-lg text-[color:var(--color-text-secondary)]">
            Honest, feature-by-feature comparisons with the tools people use to look for work.
          </p>
        </section>

        <section className="mx-auto max-w-[1200px] px-5 pb-16 md:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {VS_PAGES.map((p) => (
              <Link
                key={p.slug}
                to="/vs/$competitor"
                params={{ competitor: p.slug }}
                className="flex flex-col gap-3 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-5 transition-colors hover:border-[color:var(--color-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
              >
                <h2 className="text-lg leading-snug">{p.title}</h2>
                <p className="text-sm text-[color:var(--color-text-secondary)]">{p.deck}</p>
                <div className="mt-auto text-xs text-[color:var(--color-text-muted)]">
                  Last updated {formatDate(p.lastUpdated)}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <CtaBlock
          title="Get your matches"
          subtitle="Five ranked openings scored to you, in your inbox every day."
          cta="Get my matches"
        />
      </main>
      <Footer />
    </div>
  );
}
