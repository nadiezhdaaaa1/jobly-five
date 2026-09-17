import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Header } from "../components/site/Header";
import { Footer } from "../components/site/Footer";
import { CtaBlock } from "../components/site/CtaBlock";
import { CtaLink } from "../components/site/CtaLink";
import { ArticleBody } from "../components/blog/ArticleBody";
import { GuideFaqSection } from "../components/guides/GuideFaqSection";
import { getFeaturePage } from "../lib/features-data";
import { formatDate } from "../lib/blog-data";

const ORIGIN = "https://jobly-five.lovable.app";

export const Route = createFileRoute("/features/$feature")({
  loader: ({ params }) => {
    const page = getFeaturePage(params.feature);
    if (!page) throw notFound();
    return { page };
  },
  head: ({ params, loaderData }) => {
    const url = `${ORIGIN}/features/${params.feature}`;
    if (!loaderData) {
      return { meta: [{ title: "Feature not found" }, { name: "robots", content: "noindex" }] };
    }
    const page = loaderData.page;
    // Supplied meta title/description win verbatim; they're written to length.
    const title = page.metaTitle ?? `${page.title} — Jobly`;
    const description = page.metaDescription ?? page.deck;
    const scripts: { type: string; children: string }[] = [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: ORIGIN },
            { "@type": "ListItem", position: 2, name: page.title, item: url },
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
        { name: "description", content: description },
        { property: "og:title", content: page.title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: page.title },
        { name: "twitter:description", content: description },
        ...(page.published ? [] : [{ name: "robots", content: "noindex, follow" }]),
      ],
      links: page.published ? [{ rel: "canonical", href: url }] : [],
      scripts,
    };
  },
  notFoundComponent: FeatureNotFound,
  errorComponent: FeatureNotFound,
  component: FeaturePageRoute,
});

function FeatureNotFound() {
  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <Header />
      <main className="border-b border-[color:var(--color-border)] bg-[color:var(--color-background)]">
        <div className="border-[color:var(--color-border)] lg:mx-12 lg:border-l lg:border-r">
          <div className="mx-auto max-w-[680px] px-5 py-24 text-center md:px-8">
            <h1 className="text-3xl">Feature not found</h1>
            <p className="mt-2 text-[color:var(--color-text-secondary)]">
              The page you're looking for may have moved or been removed.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex h-11 items-center rounded-button bg-[color:var(--color-accent)] px-5 text-sm text-[color:var(--color-on-accent)]"
            >
              Back to home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function FeaturePageRoute() {
  const { page } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <Header />
      <main>
        <article className="border-b border-[color:var(--color-border)] bg-[color:var(--color-background)]">
          <div className="border-[color:var(--color-border)] lg:mx-12 lg:border-l lg:border-r">
            <header className="mx-auto max-w-[820px] px-5 pt-12 pb-6 md:px-8 md:pt-16">
              <h1 className="text-3xl leading-tight md:text-4xl">{page.title}</h1>
              <p className="mt-3 text-lg text-[color:var(--color-text-secondary)]">{page.deck}</p>
              <div className="mt-5 text-sm text-[color:var(--color-text-muted)]">
                Last updated <time dateTime={page.lastUpdated}>{formatDate(page.lastUpdated)}</time>
              </div>
            </header>

            <div className="mx-auto max-w-[820px] px-5 pb-6 md:px-8">
              <ArticleBody blocks={page.intro} />
              {/* The document's own mid-page [CTA — primary]. */}
              <div className="mt-8">
                <CtaLink className="main_accent_button">{page.closingCta}</CtaLink>
              </div>
            </div>

            <div className="mx-auto max-w-[820px] px-5 pb-10 md:px-8">
              <ArticleBody blocks={page.body} />
            </div>

            <div className="mx-auto max-w-[820px] px-5 pb-14 md:px-8">
              <GuideFaqSection items={page.faq} />
            </div>
          </div>
        </article>

        <CtaBlock
          title={page.closingTitle}
          subtitle="Five ranked openings scored to you, in your inbox every day."
          cta={page.closingCta}
        />
      </main>
      <Footer />
    </div>
  );
}
