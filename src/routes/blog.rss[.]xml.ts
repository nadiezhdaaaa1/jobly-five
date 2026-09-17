import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { PUBLISHED_BLOG_POSTS } from "@/lib/blog-data";

const BASE_URL = "https://jobly-five.lovable.app";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const Route = createFileRoute("/blog/rss.xml")({
  server: {
    handlers: {
      GET: async () => {
        const posts = [...PUBLISHED_BLOG_POSTS].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );

        const items = posts.map((p) => {
          const url = `${BASE_URL}/blog/${p.slug}`;
          const image = p.coverImage.startsWith("http") ? p.coverImage : `${BASE_URL}${p.coverImage}`;
          return [
            `    <item>`,
            `      <title>${escapeXml(p.title)}</title>`,
            `      <link>${url}</link>`,
            `      <guid isPermaLink="true">${url}</guid>`,
            `      <description>${escapeXml(p.deck)}</description>`,
            `      <category>${escapeXml(p.category)}</category>`,
            `      <author>${escapeXml(p.author)}</author>`,
            `      <pubDate>${new Date(p.date).toUTCString()}</pubDate>`,
            `      <enclosure url="${escapeXml(image)}" type="image/jpeg" />`,
            `    </item>`,
          ].join("\n");
        });

        const latest = posts[0]?.date ? new Date(posts[0].date).toUTCString() : undefined;

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">`,
          `  <channel>`,
          `    <title>The Jobly blog</title>`,
          `    <link>${BASE_URL}/blog</link>`,
          `    <description>Data, career tips, and behind-the-scenes stories on how tech hiring actually works — from the Jobly team.</description>`,
          `    <language>en-us</language>`,
          latest ? `    <lastBuildDate>${latest}</lastBuildDate>` : null,
          `    <atom:link href="${BASE_URL}/blog/rss.xml" rel="self" type="application/rss+xml" />`,
          ...items,
          `  </channel>`,
          `</rss>`,
        ]
          .filter(Boolean)
          .join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/rss+xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
