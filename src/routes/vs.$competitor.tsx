import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Header } from "../components/site/Header";
import { Footer } from "../components/site/Footer";
import { CtaBlock } from "../components/site/CtaBlock";
import { ArticleBody } from "../components/blog/ArticleBody";
import { ShareRow } from "../components/blog/ShareRow";
import { GuideFaqSection } from "../components/guides/GuideFaqSection";
import { ComparisonTable } from "../components/vs/ComparisonTable";
import { getVsPage, VS_PAGES } from "../lib/vs-data";
import { formatDate } from "../lib/blog-data";

const ORIGIN = "https://jobly-five.lovable.app";

export const Route = createFileRoute("/vs/$competitor")({
  loader: ({ params }) => {
    const page = getVsPage(params.competitor);
    if (!page) throw notFound();
    return { page, others: VS_PAGES.filter((p) => p.slug !== page.slug) };
  },
  head: ({ params, loaderData }) => {
    const url = `${ORIGIN}/vs/${params.competitor}`;
    if (!loaderData) {
      return { meta: [{ title: "Comparison not found" }, { name: "robots", content: "noindex" }] };
    }
    const page = loaderData.page;
    const title = `${page.title} — Jobly`;
    const scripts: { type: string; children: string }[] = [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: page.title,
          description: page.deck,
          datePublished: page.lastUpdated,
          dateModified: page.lastUpdated,
          publisher: { "@type": "Organization", name: "Jobly", url: ORIGIN },
          mainEntityOfPage: url,
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: ORIGIN },
            { "@type": "ListItem", position: 2, name: "Compare", item: `${ORIGIN}/vs` },
            { "@type": "ListItem", position: 3, name: page.title, item: url },
          ],
        }),
      },
    ];
    if (page.faq.length > 0) {
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: page.faq.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        }),
      });
    }
    return {
      meta: [
        { title },
        { name: "description", content: page.deck },
        { property: "og:title", content: page.title },
        { property: "og:description", content: page.deck },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: page.title },
        { name: "twitter:description", content: page.deck },
        ...(page.published ? [] : [{ name: "robots", content: "noindex, follow" }]),
      ],
      links: page.published ? [{ rel: "canonical", href: url }] : [],
      scripts,
    };
  },
  notFoundComponent: VsNotFound,
  errorComponent: VsNotFound,
  component: VsPageRoute,
});

function VsNotFound() {
  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <Header />
      <main className="mx-auto max-w-[680px] px-5 py-24 text-center md:px-8">
        <h1 className="text-3xl">Comparison not found</h1>
        <p className="mt-2 text-[color:var(--color-text-secondary)]">
          The page you're looking for may have moved or been removed.
        </p>
        <Link
          to="/vs"
          className="mt-6 inline-flex h-11 items-center rounded-button bg-[color:var(--color-accent)] px-5 text-sm text-[color:var(--color-on-accent)]"
        >
          Back to comparisons
        </Link>
      </main>
      <Footer />
    </div>
  );
}

function VsPageRoute() {
  const { page, others } = Route.useLoaderData();
  const url = `${ORIGIN}/vs/${page.slug}`;

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <Header />
      <main>
        <article>
          <header className="mx-auto max-w-[820px] px-5 pt-12 pb-6 md:px-8 md:pt-16">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm">
              <Link to="/vs" className="text-[color:var(--color-green)] hover:underline">
                Compare
              </Link>
            </nav>
            <h1 className="mt-3 text-3xl leading-tight md:text-4xl">{page.title}</h1>
            <p className="mt-3 text-lg text-[color:var(--color-text-secondary)]">{page.deck}</p>
            <div className="mt-5 text-sm text-[color:var(--color-text-muted)]">
              Last updated <time dateTime={page.lastUpdated}>{formatDate(page.lastUpdated)}</time>
            </div>
            <div className="mt-6">
              <ShareRow url={url} title={page.title} />
            </div>
          </header>

          <div className="mx-auto max-w-[820px] px-5 py-6 md:px-8 md:py-10">
            <ComparisonTable rows={page.comparison} competitorName={page.competitorName} />

            <div className={page.comparison.length > 0 ? "mt-12" : undefined}>
              <ArticleBody blocks={page.body} />
            </div>

            <div className="mx-auto mt-10 max-w-[680px] rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-5">
              <p className="text-sm text-[color:var(--color-text-secondary)]">
                See how Jobly stacks up against other tools in{" "}
                <Link to="/vs" className="text-[color:var(--color-green)] hover:underline">
                  all comparisons
                </Link>
                .
              </p>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm">
                {others.map((o) => (
                  <li key={o.slug}>
                    <Link
                      to="/vs/$competitor"
                      params={{ competitor: o.slug }}
                      className="text-[color:var(--color-green)] hover:underline"
                    >
                      {o.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-12">
              <GuideFaqSection items={page.faq} />
            </div>
          </div>
        </article>

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
