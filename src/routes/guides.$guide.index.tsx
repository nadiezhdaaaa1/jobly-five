import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Header } from "../components/site/Header";
import { Footer } from "../components/site/Footer";
import { CtaBlock } from "../components/site/CtaBlock";
import { ArticleBody } from "../components/blog/ArticleBody";
import { ShareRow } from "../components/blog/ShareRow";
import { GuideFaqSection } from "../components/guides/GuideFaqSection";
import { getGuide, getArticlesForGuide } from "../lib/guides-data";
import { formatDate } from "../lib/blog-data";

const ORIGIN = "https://jobly-five.lovable.app";

export const Route = createFileRoute("/guides/$guide/")({
  loader: ({ params }) => {
    const guide = getGuide(params.guide);
    if (!guide) throw notFound();
    return { guide, articles: getArticlesForGuide(guide.slug) };
  },
  head: ({ params, loaderData }) => {
    const url = `${ORIGIN}/guides/${params.guide}`;
    if (!loaderData) {
      return { meta: [{ title: "Guide not found" }, { name: "robots", content: "noindex" }] };
    }
    const guide = loaderData.guide;
    const title = `${guide.title} — Jobly`;
    const scripts: { type: string; children: string }[] = [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: guide.title,
          description: guide.deck,
          datePublished: guide.lastUpdated,
          dateModified: guide.lastUpdated,
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
            { "@type": "ListItem", position: 2, name: "Guides", item: `${ORIGIN}/guides` },
            { "@type": "ListItem", position: 3, name: guide.title, item: url },
          ],
        }),
      },
    ];
    if (guide.faq.length > 0) {
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: guide.faq.map((f) => ({
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
        { name: "description", content: guide.deck },
        { property: "og:title", content: guide.title },
        { property: "og:description", content: guide.deck },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: guide.title },
        { name: "twitter:description", content: guide.deck },
        ...(guide.published ? [] : [{ name: "robots", content: "noindex, follow" }]),
      ],
      links: guide.published ? [{ rel: "canonical", href: url }] : [],
      scripts,
    };
  },
  notFoundComponent: GuideNotFound,
  errorComponent: GuideNotFound,
  component: GuideHub,
});

function GuideNotFound() {
  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <Header />
      <main className="mx-auto max-w-[680px] px-5 py-24 text-center md:px-8">
        <h1 className="text-3xl">Guide not found</h1>
        <p className="mt-2 text-[color:var(--color-text-secondary)]">
          The guide you're looking for may have moved or been removed.
        </p>
        <Link
          to="/guides"
          className="mt-6 inline-flex h-11 items-center rounded-button bg-[color:var(--color-accent)] px-5 text-sm text-[color:var(--color-on-accent)]"
        >
          Back to guides
        </Link>
      </main>
      <Footer />
    </div>
  );
}

function GuideHub() {
  const { guide, articles } = Route.useLoaderData();
  const url = `${ORIGIN}/guides/${guide.slug}`;

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <Header />
      <main>
        <article>
          <header className="mx-auto max-w-[820px] px-5 pt-12 pb-6 md:px-8 md:pt-16">
            <nav aria-label="Breadcrumb" className="text-sm">
              <Link to="/guides" className="text-[color:var(--color-green)] hover:underline">
                ← All guides
              </Link>
            </nav>
            <h1 className="mt-4 text-3xl leading-tight md:text-4xl">{guide.title}</h1>
            <p className="mt-3 text-lg text-[color:var(--color-text-secondary)]">{guide.deck}</p>
            <div className="mt-5 text-sm text-[color:var(--color-text-muted)]">
              Last updated <time dateTime={guide.lastUpdated}>{formatDate(guide.lastUpdated)}</time>
            </div>
            <div className="mt-6">
              <ShareRow url={url} title={guide.title} />
            </div>
          </header>

          {guide.body.length > 0 && (
            <div className="mx-auto max-w-[820px] px-5 pb-10 md:px-8">
              <ArticleBody blocks={guide.body} />
            </div>
          )}

          <section className="mx-auto max-w-[820px] px-5 pb-10 md:px-8">
            <h2 className="text-2xl">In this guide</h2>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {articles.map((a) => (
                <Link
                  key={a.slug}
                  to="/guides/$guide/$slug"
                  params={{ guide: guide.slug, slug: a.slug }}
                  className="flex flex-col gap-2 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-5 transition-colors hover:border-[color:var(--color-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
                >
                  <h3 className="text-base leading-snug">{a.title}</h3>
                  <p className="text-sm text-[color:var(--color-text-secondary)]">{a.deck}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-[color:var(--color-text-muted)]">
                    <span>{a.readTime}</span>
                    <span aria-hidden>·</span>
                    <span>Last updated {formatDate(a.lastUpdated)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <div className="mx-auto max-w-[820px] px-5 pb-14 md:px-8">
            <GuideFaqSection items={guide.faq} />
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
