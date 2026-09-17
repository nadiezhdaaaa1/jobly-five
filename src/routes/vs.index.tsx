import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "../components/site/Header";
import { Footer } from "../components/site/Footer";
import { CtaBlock } from "../components/site/CtaBlock";
import { VS_INDEX } from "../lib/vs-data";

const ORIGIN = "https://jobly-five.lovable.app";
const URL = `${ORIGIN}/vs`;

// `VS_INDEX.published` is the single switch: false → noindex, follow + no canonical + out of the sitemap.
const PUBLISHED = VS_INDEX.published;

export const Route = createFileRoute("/vs/")({
  head: () => {
    const title = VS_INDEX.metaTitle;
    const description = VS_INDEX.metaDescription;
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
        <section className="bg-[color:var(--color-background)]">
          <div className="border-[color:var(--color-border)] lg:mx-12 lg:border-l lg:border-r">
            <div className="mx-auto max-w-[1200px] px-5 pt-12 pb-8 md:px-8 md:pt-16">
              <h1 className="text-3xl leading-tight md:text-4xl">{VS_INDEX.h1}</h1>
              {VS_INDEX.intro.map((p) => (
                <p
                  key={p.slice(0, 24)}
                  className="mt-4 max-w-[680px] text-lg text-[color:var(--color-text-secondary)]"
                >
                  {p}
                </p>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--color-border)] bg-[color:var(--color-background)]">
          <div className="border-[color:var(--color-border)] lg:mx-12 lg:border-l lg:border-r">
            <div className="mx-auto max-w-[1200px] px-5 pb-16 md:px-8">
              <h2 className="text-2xl">{VS_INDEX.gridHeading}</h2>
              <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {VS_INDEX.items.map((item) => (
                  <Link
                    key={item.slug}
                    to="/vs/$competitor"
                    params={{ competitor: item.slug }}
                    className="flex flex-col gap-3 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-5 transition-colors hover:border-[color:var(--color-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
                  >
                    <h3 className="text-lg leading-snug">{item.label}</h3>
                    <p className="text-sm text-[color:var(--color-text-secondary)]">{item.blurb}</p>
                  </Link>
                ))}
              </div>
              <p className="mt-8 max-w-[680px] text-[color:var(--color-text-secondary)]">
                {VS_INDEX.closing}
              </p>
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
