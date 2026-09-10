import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Header } from "../components/site/Header";
import { Footer } from "../components/site/Footer";
import { CtaBlock } from "../components/site/CtaBlock";
import { FaqSection } from "../components/site/FaqSection";
import { BlogCard } from "../components/blog/BlogCard";
import { CategoryChip } from "../components/blog/CategoryChip";
import { BLOG_CATEGORIES, BLOG_POSTS } from "../lib/blog-data";

const PAGE_SIZE = 9;
const ORIGIN = "https://jobly-five.lovable.app";
const CANONICAL = `${ORIGIN}/blog`;

type BlogSearch = { page?: number; category?: string };

function buildUrl(page: number, category?: string) {
  const params = new URLSearchParams();
  if (category && category !== "All") params.set("category", category);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${CANONICAL}?${qs}` : CANONICAL;
}

function pageCount(category?: string) {
  const total =
    !category || category === "All"
      ? BLOG_POSTS.length
      : BLOG_POSTS.filter((p) => p.category === category).length;
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}

export const Route = createFileRoute("/blog/")({
  validateSearch: (search: Record<string, unknown>): BlogSearch => {
    const rawPage = Number(search.page);
    const page = Number.isFinite(rawPage) && rawPage > 1 ? Math.floor(rawPage) : undefined;
    const raw = typeof search.category === "string" ? search.category : undefined;
    const category = raw && (BLOG_CATEGORIES as readonly string[]).includes(raw) ? raw : undefined;
    return { page, category };
  },
  head: ({ match }) => {
    const { page = 1, category } = match.search as BlogSearch;
    const totalPages = pageCount(category);
    const suffix = page > 1 ? ` — Page ${page}` : "";
    const catSuffix = category ? ` · ${category}` : "";
    const title = `The Jobly blog${catSuffix}${suffix} — Job market signal, not noise`;
    const description = category
      ? `${category} articles from the Jobly team — data, career tips, and honest takes on how tech hiring actually works.`
      : "Data, career tips, and behind-the-scenes stories on how tech hiring actually works — from the Jobly team.";
    const self = buildUrl(page, category);

    const links: { rel: string; href: string; type?: string; title?: string }[] = [
      { rel: "canonical", href: self },
    ];
    if (page > 1) links.push({ rel: "prev", href: buildUrl(page - 1, category) });
    if (page < totalPages) links.push({ rel: "next", href: buildUrl(page + 1, category) });
    links.push({
      rel: "alternate",
      type: "application/rss+xml",
      title: "The Jobly blog RSS feed",
      href: `${ORIGIN}/blog/rss.xml`,
    });

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: `The Jobly blog${catSuffix}${suffix}` },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: self },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: `The Jobly blog${catSuffix}` },
        { name: "twitter:description", content: description },
      ],
      links,
    };
  },
  component: BlogListPage,
});

function BlogListPage() {
  const { page = 1, category } = Route.useSearch();
  const active = category ?? "All";

  const filtered = useMemo(
    () => (active === "All" ? BLOG_POSTS : BLOG_POSTS.filter((p) => p.category === active)),
    [active],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const shown = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <Header />
      <main>
        <section className="bg-[color:var(--color-background)]">
          <div className="border-[color:var(--color-border)] lg:mx-12 lg:border-l lg:border-r">
            <div className="mx-auto max-w-[1200px] px-5 pt-12 pb-6 md:px-8 md:pt-16">
              <h1 className="text-4xl md:text-5xl">The Jobly blog</h1>
              <p className="mt-3 max-w-2xl text-[color:var(--color-text-secondary)]">
                Data, tips, and honest takes on how tech hiring actually works — from the team
                building your daily digest.
              </p>

              <div
                className="mt-8 flex flex-wrap gap-2"
                role="group"
                aria-label="Filter by category"
              >
                {["All", ...BLOG_CATEGORIES].map((c) => (
                  <Link
                    key={c}
                    to="/blog"
                    search={c === "All" ? {} : { category: c }}
                    className="focus-visible:outline-none"
                  >
                    <CategoryChip label={c} active={active === c} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[color:var(--color-border)] bg-[color:var(--color-background)]">
          <div className="border-[color:var(--color-border)] lg:mx-12 lg:border-l lg:border-r">
            <div className="mx-auto max-w-[1200px] px-5 pb-16 md:px-8">
              {shown.length === 0 ? (
                <p className="py-12 text-center text-[color:var(--color-text-muted)]">
                  Nothing here yet in this category.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {shown.map((p) => (
                    <BlogCard key={p.slug} post={p} />
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <nav
                  className="mt-10 flex items-center justify-center gap-2"
                  aria-label="Blog pagination"
                >
                  {current > 1 && (
                    <Link
                      to="/blog"
                      search={{
                        ...(category ? { category } : {}),
                        ...(current - 1 > 1 ? { page: current - 1 } : {}),
                      }}
                      rel="prev"
                      className="secondary_button secondary_button--on-light secondary_button--sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
                    >
                      Previous
                    </Link>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <Link
                      key={n}
                      to="/blog"
                      search={{
                        ...(category ? { category } : {}),
                        ...(n > 1 ? { page: n } : {}),
                      }}
                      aria-current={n === current ? "page" : undefined}
                      className={`${
                        n === current
                          ? "main_accent_button main_accent_button--on-light main_accent_button--icon"
                          : "secondary_button secondary_button--on-light secondary_button--icon"
                      } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]`}
                    >
                      {n}
                    </Link>
                  ))}
                  {current < totalPages && (
                    <Link
                      to="/blog"
                      search={{ ...(category ? { category } : {}), page: current + 1 }}
                      rel="next"
                      className="secondary_button secondary_button--on-light secondary_button--sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
                    >
                      Next
                    </Link>
                  )}
                </nav>
              )}
            </div>
          </div>
        </section>

        <FaqSection />

        <CtaBlock />
      </main>
      <Footer />
    </div>
  );
}
