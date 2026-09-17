import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Header } from "../components/site/Header";
import { Footer } from "../components/site/Footer";
import { CtaBlock } from "../components/site/CtaBlock";
import { GuideFaqSection } from "../components/guides/GuideFaqSection";
import { getToolPage } from "../lib/tools-data";

const ORIGIN = "https://jobly-five.lovable.app";

export const Route = createFileRoute("/tools/$tool")({
  loader: ({ params }) => {
    const page = getToolPage(params.tool);
    if (!page) throw notFound();
    return { page };
  },
  head: ({ params, loaderData }) => {
    const url = `${ORIGIN}/tools/${params.tool}`;
    if (!loaderData) {
      return { meta: [{ title: "Tool not found" }, { name: "robots", content: "noindex" }] };
    }
    const page = loaderData.page;
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
  notFoundComponent: ToolNotFound,
  errorComponent: ToolNotFound,
  component: ToolPageRoute,
});

function ToolNotFound() {
  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <Header />
      <main className="border-b border-[color:var(--color-border)] bg-[color:var(--color-background)]">
        <div className="border-[color:var(--color-border)] lg:mx-12 lg:border-l lg:border-r">
          <div className="mx-auto max-w-[680px] px-5 py-24 text-center md:px-8">
            <h1 className="text-3xl">Tool not found</h1>
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

function ToolPageRoute() {
  const { page } = Route.useLoaderData();
  // No client state: while `status` is "coming-soon" there is nothing to submit,
  // so the form is inert by construction rather than by a disabled handler.
  const comingSoon = page.status === "coming-soon";

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <Header />
      <main>
        <section className="border-b border-[color:var(--color-border)] bg-[color:var(--color-background)]">
          <div className="border-[color:var(--color-border)] lg:mx-12 lg:border-l lg:border-r">
            <header className="mx-auto max-w-[820px] px-5 pt-12 pb-6 md:px-8 md:pt-16">
              <h1 className="text-3xl leading-tight md:text-4xl">{page.title}</h1>
              <p className="mt-4 text-lg text-[color:var(--color-text-secondary)]">{page.intro}</p>
            </header>

            <div className="mx-auto max-w-[820px] px-5 pb-10 md:px-8">
              <div className="rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-5">
                <label
                  htmlFor="listing"
                  className="block text-sm font-medium text-[color:var(--color-foreground)]"
                >
                  {page.input.label}
                </label>
                <textarea
                  id="listing"
                  rows={6}
                  disabled={comingSoon}
                  aria-describedby="listing-helper"
                  placeholder={page.input.placeholder}
                  className="mt-2 w-full rounded-[12px] border border-[color:var(--color-border)] bg-[color:var(--color-background)] px-4 py-3 text-sm text-[color:var(--color-foreground)] placeholder:text-[color:var(--color-text-muted)] disabled:cursor-not-allowed disabled:opacity-60"
                />
                <p id="listing-helper" className="mt-2 text-xs text-[color:var(--color-text-muted)]">
                  {page.input.helper}
                </p>
                <button
                  type="button"
                  disabled={comingSoon}
                  className="mt-4 inline-flex h-11 items-center rounded-[12px] bg-[color:var(--color-accent)] px-5 text-sm text-[color:var(--color-on-accent)] disabled:cursor-not-allowed disabled:bg-[color:var(--color-surface-2)] disabled:text-[color:var(--color-text-muted)]"
                >
                  {page.input.button}
                </button>

                {comingSoon && (
                  <div
                    role="status"
                    className="mt-5 rounded-[12px] border border-[color:var(--color-border)] bg-[color:var(--color-background)] p-4"
                  >
                    <div className="text-sm font-medium">{page.comingSoon.title}</div>
                    <p className="mt-1.5 text-sm text-[color:var(--color-text-secondary)]">
                      {page.comingSoon.body}
                    </p>
                    <Link
                      to="/guides/$guide"
                      params={{ guide: "ghost-jobs" }}
                      className="mt-3 inline-block text-sm text-[color:var(--color-green)] hover:underline"
                    >
                      Read the ghost jobs guide
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <div className="mx-auto max-w-[820px] px-5 pb-14 md:px-8">
              <GuideFaqSection items={page.faq} />
            </div>
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
