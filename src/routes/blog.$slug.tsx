import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Header } from "../components/site/Header";
import { Footer } from "../components/site/Footer";
import { CtaBlock } from "../components/site/CtaBlock";
import { BlogCard } from "../components/blog/BlogCard";
import { ArticleBody } from "../components/blog/ArticleBody";
import { TableOfContents, type TocItem } from "../components/blog/TableOfContents";
import { ShareRow } from "../components/blog/ShareRow";
import { getPostBySlug, getRelated, formatDate, slugifyHeading } from "../lib/blog-data";
import type { BlogPost } from "../lib/blog-data";

const ORIGIN = "https://jobly-five.lovable.app";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = getPostBySlug(params.slug);
    if (!post) throw notFound();
    return { post };
  },
  head: ({ params, loaderData }) => {
    const url = `${ORIGIN}/blog/${params.slug}`;
    if (!loaderData) {
      return {
        meta: [{ title: "Article not found" }, { name: "robots", content: "noindex" }],
      };
    }
    const post = loaderData.post;
    const abs = post.coverImage.startsWith("http") ? post.coverImage : `${ORIGIN}${post.coverImage}`;
    return {
      meta: [
        { title: `${post.title} — Jobly blog` },
        { name: "description", content: post.deck },
        { property: "og:title", content: post.title },
        { property: "og:description", content: post.deck },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "og:image", content: abs },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: post.title },
        { name: "twitter:description", content: post.deck },
        { name: "twitter:image", content: abs },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.deck,
            image: abs,
            author: { "@type": "Person", name: post.author },
            datePublished: post.date,
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
              { "@type": "ListItem", position: 2, name: "Blog", item: `${ORIGIN}/blog` },
              { "@type": "ListItem", position: 3, name: post.title, item: url },
            ],
          }),
        },
      ],
    };
  },
  notFoundComponent: NotFound,
  errorComponent: ErrorPage,
  component: ArticlePage,
});

function NotFound() {
  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <Header />
      <main className="mx-auto max-w-[680px] px-5 py-24 text-center md:px-8">
        <h1 className="text-3xl">Article not found</h1>
        <p className="mt-2 text-[color:var(--color-text-secondary)]">
          The post you're looking for may have moved or been removed.
        </p>
        <Link
          to="/blog"
          className="mt-6 inline-flex h-11 items-center rounded-button bg-[color:var(--color-accent)] px-5 text-sm text-[color:var(--color-on-accent)]"
        >
          Back to the blog
        </Link>
      </main>
      <Footer />
    </div>
  );
}

function ErrorPage() {
  return <NotFound />;
}

function buildToc(post: BlogPost): TocItem[] {
  return post.body
    .filter((b): b is Extract<BlogPost["body"][number], { type: "h2" | "h3" }> => b.type === "h2" || b.type === "h3")
    .map((b) => ({ id: slugifyHeading(b.text), text: b.text, level: b.type === "h2" ? 2 : 3 }));
}

function ArticlePage() {
  const { post } = Route.useLoaderData();
  const toc = buildToc(post);
  const related = getRelated(post, 3);
  const url = `${ORIGIN}/blog/${post.slug}`;

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <Header />
      <main>
        <article>
          <header className="mx-auto max-w-[820px] px-5 pt-12 pb-6 md:px-8 md:pt-16">
            <div className="text-sm">
              <Link to="/blog" className="text-[color:var(--color-green)] hover:underline">
                ← Back to blog
              </Link>
            </div>
            <span className="mt-4 inline-flex items-center rounded-button bg-[color:var(--color-mint)] px-2.5 py-1 text-xs text-[color:var(--color-green)]">
              {post.category}
            </span>
            <h1 className="mt-3 text-3xl leading-tight md:text-4xl">{post.title}</h1>
            <p className="mt-3 text-lg text-[color:var(--color-text-secondary)]">{post.deck}</p>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-[color:var(--color-text-muted)]">
              <span>{post.author}</span>
              <span aria-hidden>·</span>
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              <span aria-hidden>·</span>
              <span>{post.readTime}</span>
            </div>
            <div className="mt-6">
              <ShareRow url={url} title={post.title} />
            </div>
          </header>

          <div className="mx-auto max-w-[820px] px-5 md:px-8">
            <div className="overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]">
              <img src={post.coverImage} alt={post.coverAlt} className="h-auto w-full" />
            </div>
          </div>

          <div className="mx-auto max-w-[1200px] px-5 py-10 md:px-8 md:py-14">
            <div className="grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
              <TableOfContents items={toc} />
              <div className="min-w-0">
                <ArticleBody blocks={post.body} />
              </div>
            </div>
          </div>
        </article>

        <CtaBlock title="Get your matches" subtitle="Five ranked openings scored to you, in your inbox every day." cta="Get my matches" />

        {related.length > 0 && (
          <section className="mx-auto max-w-[1200px] px-5 pb-20 md:px-8">
            <h2 className="text-2xl">Related reads</h2>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <BlogCard key={p.slug} post={p} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}