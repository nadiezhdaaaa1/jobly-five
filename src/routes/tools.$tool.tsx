import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Header } from "../components/site/Header";
import { Footer } from "../components/site/Footer";
import { CtaBlock } from "../components/site/CtaBlock";
import { CtaLink } from "../components/site/CtaLink";
import { GuideFaqSection } from "../components/guides/GuideFaqSection";
import { getToolPage, type ToolPage } from "../lib/tools-data";

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

/** Accent per level. Verdict copy comes from the data file; only colour is here. */
const LEVEL_ACCENT: Record<"low" | "medium" | "high", string> = {
  low: "var(--color-green)",
  medium: "var(--color-warning, #B45309)",
  high: "var(--color-danger, #DC2626)",
};

function ResultCard({
  state,
  cta,
}: {
  state: ToolPage["resultStates"][number];
  cta: ToolPage["postResultCta"];
}) {
  const accent = LEVEL_ACCENT[state.level];
  return (
    <div
      className="rounded-[12px] border bg-[color:var(--color-background)] p-4"
      style={{ borderColor: accent }}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: accent }}
        />
        <span className="text-sm font-medium" style={{ color: accent }}>
          {state.label}
        </span>
      </div>
      <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">{state.body}</p>
      <p className="mt-3 text-sm text-[color:var(--color-foreground)]">
        {state.level === "low" ? cta.afterLow : cta.afterMediumOrHigh}
      </p>
      <div className="mt-3">
        <CtaLink className="main_accent_button">{cta.button}</CtaLink>
      </div>
    </div>
  );
}

function ToolPageRoute() {
  const { page } = Route.useLoaderData();
  const [value, setValue] = useState("");
  const [working, setWorking] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sample, setSample] = useState<"low" | "medium" | "high" | null>(null);

  function onSubmit() {
    // No scoring here, deliberately: the check runs server-side once the dev
    // team's backend exists. Until then a submit resolves into pendingResult.
    setWorking(true);
    setSubmitted(false);
    window.setTimeout(() => {
      setWorking(false);
      setSubmitted(true);
    }, 700);
  }

  const disabled = working || value.trim().length === 0;

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
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  aria-describedby="listing-helper"
                  placeholder={page.input.placeholder}
                  className="mt-2 w-full rounded-[12px] border border-[color:var(--color-border)] bg-[color:var(--color-background)] px-4 py-3 text-sm text-[color:var(--color-foreground)] placeholder:text-[color:var(--color-text-muted)]"
                />
                <p id="listing-helper" className="mt-2 text-xs text-[color:var(--color-text-muted)]">
                  {page.input.helper}
                </p>
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={disabled}
                  aria-busy={working}
                  className="mt-4 inline-flex h-11 items-center rounded-[12px] bg-[color:var(--color-accent)] px-5 text-sm text-[color:var(--color-on-accent)] disabled:cursor-not-allowed disabled:bg-[color:var(--color-surface-2)] disabled:text-[color:var(--color-text-muted)]"
                >
                  {working ? page.input.buttonWorking : page.input.button}
                </button>

                {submitted && (
                  <div
                    role="status"
                    className="mt-5 rounded-[12px] border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-background)] p-4"
                  >
                    <div className="text-sm font-medium">{page.pendingResult.title}</div>
                    <p className="mt-1.5 text-sm text-[color:var(--color-text-secondary)]">
                      {page.pendingResult.body}
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

              {/* The three verdict states, styled and reachable. Explicitly
                  labelled as samples so nothing here reads as a verdict on a
                  listing someone pasted above. */}
              <div className="mt-8">
                <h2 className="text-sm font-semibold">What the check will report</h2>
                <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
                  Sample results, not a check of your listing.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {page.resultStates.map((s) => (
                    <button
                      key={s.level}
                      type="button"
                      aria-pressed={sample === s.level}
                      onClick={() => setSample(sample === s.level ? null : s.level)}
                      className={`inline-flex h-9 items-center rounded-[12px] border px-3 text-sm ${
                        sample === s.level
                          ? "border-[color:var(--color-foreground)] bg-[color:var(--color-surface-2)]"
                          : "border-[color:var(--color-border)] text-[color:var(--color-text-secondary)]"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                {sample && (
                  <div className="mt-4">
                    <ResultCard
                      state={page.resultStates.find((s) => s.level === sample)!}
                      cta={page.postResultCta}
                    />
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
