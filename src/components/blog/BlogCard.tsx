import { Link } from "@tanstack/react-router";
import type { BlogPost } from "../../lib/blog-data";
import { formatDate } from "../../lib/blog-data";

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className="group flex flex-col overflow-hidden rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] transition-colors hover:border-[color:var(--color-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
    >
      <div className="aspect-[16/9] w-full overflow-hidden bg-[color:var(--color-surface-2)]">
        <img
          src={post.coverImage}
          alt={post.coverAlt}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          loading="lazy"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <span className="inline-flex w-fit items-center rounded-button bg-[color:var(--color-mint)] px-2.5 py-1 text-xs text-[color:var(--color-green)]">
          {post.category}
        </span>
        <h3 className="text-lg leading-snug">{post.title}</h3>
        <p className="line-clamp-2 text-sm text-[color:var(--color-text-secondary)]">{post.deck}</p>
        <div className="mt-auto flex items-center gap-2 text-xs text-[color:var(--color-text-muted)]">
          <span>{post.readTime}</span>
          <span aria-hidden>·</span>
          <time dateTime={post.date}>{formatDate(post.date)}</time>
        </div>
      </div>
    </Link>
  );
}