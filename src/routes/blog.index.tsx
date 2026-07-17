import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Header } from "../components/site/Header";
import { Footer } from "../components/site/Footer";
import { CtaBlock } from "../components/site/CtaBlock";
import { BlogCard } from "../components/blog/BlogCard";
import { CategoryChip } from "../components/blog/CategoryChip";
import { BLOG_CATEGORIES, BLOG_POSTS } from "../lib/blog-data";

const PAGE_SIZE = 9;
const CANONICAL = "https://jobly-five.lovable.app/blog";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "The Jobly blog — Job market signal, not noise" },
      { name: "description", content: "Data, career tips, and behind-the-scenes stories on how tech hiring actually works — from the Jobly team." },
      { property: "og:title", content: "The Jobly blog" },
      { property: "og:description", content: "Data, career tips, and behind-the-scenes stories on how tech hiring actually works." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: CANONICAL },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "The Jobly blog" },
      { name: "twitter:description", content: "Data, career tips, and behind-the-scenes stories on how tech hiring actually works." },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
  }),
  component: BlogListPage,
});

function BlogListPage() {
  const [active, setActive] = useState<string>("All");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(
    () => (active === "All" ? BLOG_POSTS : BLOG_POSTS.filter((p) => p.category === active)),
    [active],
  );
  const shown = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [active]);

  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) setVisible((v) => v + PAGE_SIZE);
    }, { rootMargin: "300px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore]);

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <Header />
      <main>
        <section className="mx-auto max-w-[1200px] px-5 pt-12 pb-6 md:px-8 md:pt-16">
          <h1 className="text-4xl md:text-5xl">The Jobly blog</h1>
          <p className="mt-3 max-w-2xl text-[color:var(--color-text-secondary)]">
            Data, tips, and honest takes on how tech hiring actually works — from the team building your daily digest.
          </p>

          <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            {["All", ...BLOG_CATEGORIES].map((c) => (
              <CategoryChip key={c} label={c} active={active === c} onClick={() => setActive(c)} />
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-5 pb-16 md:px-8">
          {shown.length === 0 ? (
            <p className="py-12 text-center text-[color:var(--color-text-muted)]">Nothing here yet in this category.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {shown.map((p) => (
                <BlogCard key={p.slug} post={p} />
              ))}
            </div>
          )}

          {hasMore && (
            <div ref={sentinelRef} className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="inline-flex h-11 items-center rounded-button border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-5 text-sm hover:border-[color:var(--color-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
              >
                Load more
              </button>
            </div>
          )}
        </section>

        <CtaBlock />
      </main>
      <Footer />
    </div>
  );
}