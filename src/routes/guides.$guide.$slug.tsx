import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Header } from "../components/site/Header";
import { Footer } from "../components/site/Footer";
import { CtaBlock } from "../components/site/CtaBlock";
import { ArticleBody } from "../components/blog/ArticleBody";
import { TableOfContents, type TocItem } from "../components/blog/TableOfContents";
import { ShareRow } from "../components/blog/ShareRow";
import { GuideFaqSection } from "../components/guides/GuideFaqSection";
import { getGuide, getGuideArticle, getArticlesForGuide } from "../lib/guides-data";
import type { GuideArticle } from "../lib/guides-data";
import { formatDate, slugifyHeading } from "../lib/blog-data";

const ORIGIN = "https://jobly-five.lovable.app";

export const Route = createFileRoute("/guides/$guide/$slug")({
  loader: ({ params }) => {
    const guide = getGuide(params.guide);
    const article = guide ? getGuideArticle(params.guide, params.slug) : undefined;
    if (!guide || !article) throw notFound();
    return {
      guide,
      article,
      siblings: getArticlesForGuide(guide.slug).filter((a) => a.slug !== article.slug),
    };
  },
  head: ({ params, loaderData }) => {
    const url = `${ORIGIN}/guides/${params.guide}/${params.slug}`;
    if (!loaderData) {
      return { meta: [{ title: "Article not found" }, { name: "robots", content: "noindex" }] };
    }
    const { guide, article } = loaderData;
    const title = `${article.title} — ${guide.title} — Jobly`;
    const scripts: { type: string; children: string }[] = [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.deck,
          datePublished: article.date,
          dateModified: article.lastUpdated,
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
            { "@type": "ListItem", position: 3, name: guide.title, item: `${ORIGIN}/guides/${guide.slug}` },
            { "@type": "ListItem", position: 4, name: article.title, item: url },
          ],
        }),
      },
    ];
    if (article.faq.length > 0) {
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: article.faq.map((f) => ({
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
        { name: "description", content: article.deck },
        { property: "og:title", content: article.title },
        { property: "og:description", content: article.deck },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: article.title },
        { name: "twitter:description", content: article.deck },
        ...(article.published ? [] : [{ name: "robots", content: "noindex, follow" }]),
      ],
      links: article.published ? [{ rel: "canonical", href: url }] : [],
      scripts,
    };
  },
  notFoundComponent: ArticleNotFound,
  errorComponent: ArticleNotFound,
  component: GuideArticlePage,
});

function ArticleNotFound() {
  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <Header />
      <main className="mx-auto max-w-[680px] px-5 py-24 text-center md:px-8">
        <h1 className="text-3xl">Article not found</h1>
        <p className="mt-2 text-[color:var(--color-text-secondary)]">
          The page you're looking for may have moved or been removed.
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

function buildToc(article: GuideArticle): TocItem[] {
  return article.body
    .filter((b): b is Extract<GuideArticle["body"][number], { type: "h2" | "h3" }> => b.type === "h2" || b.type === "h3")
    .map((b) => ({ id: slugifyHeading(b.text), text: b.text, level: b.type === "h2" ? 2 : 3 }));
}

function GuideArticlePage() {
  const { guide, article, siblings } = Route.useLoaderData();
  const toc = buildToc(article);
  const url = `${ORIGIN}/guides/${guide.slug}/${article.slug}`;

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <Header />
      <main>
        <article>
          <header className="mx-auto max-w-[820px] px-5 pt-12 pb-6 md:px-8 md:pt-16">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm">
              <Link to="/guides" className="text-[color:var(--color-green)] hover:underline">
                Guides
              </Link>
              <span aria-hidden className="text-[color:var(--color-text-muted)]">
                /
              </span>
              <Link
                to="/guides/$guide"
                params={{ guide: guide.slug }}
                className="text-[color:var(--color-green)] hover:underline"
              >
                {guide.title}
              </Link>
            </nav>
            <h1 className="mt-3 text-3xl leading-tight md:text-4xl">{article.title}</h1>
            <p className="mt-3 text-lg text-[color:var(--color-text-secondary)]">{article.deck}</p>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-[color:var(--color-text-muted)]">
              <span>{article.readTime}</span>
              <span aria-hidden>·</span>
              <span>
                Last updated <time dateTime={article.lastUpdated}>{formatDate(article.lastUpdated)}</time>
              </span>
            </div>
            <div className="mt-6">
              <ShareRow url={url} title={article.title} />
            </div>
          </header>

          <div className="mx-auto max-w-[1200px] px-5 py-6 md:px-8 md:py-10">
            <div className="grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
              <TableOfContents items={toc} />
              <div className="min-w-0">
                <ArticleBody blocks={article.body} />

                <div className="mx-auto mt-10 max-w-[680px] rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-5">
                  <p className="text-sm text-[color:var(--color-text-secondary)]">
                    This article is part of the{" "}
                    <Link
                      to="/guides/$guide"
                      params={{ guide: guide.slug }}
                      className="text-[color:var(--color-green)] hover:underline"
                    >
                      {guide.title}
                    </Link>
                    .
                  </p>
                  {siblings.length > 0 && (
                    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm">
                      {siblings.map((s) => (
                        <li key={s.slug}>
                          <Link
                            to="/guides/$guide/$slug"
                            params={{ guide: guide.slug, slug: s.slug }}
                            className="text-[color:var(--color-green)] hover:underline"
                          >
                            {s.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-12">
                  <GuideFaqSection items={article.faq} />
                </div>
              </div>
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
