import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { PUBLISHED_BLOG_POSTS } from "@/lib/blog-data";
import { GUIDES, GUIDE_ARTICLES } from "@/lib/guides-data";
import { VS_PAGES } from "@/lib/vs-data";
import { FEATURE_PAGES } from "@/lib/features-data";
import { TOOL_PAGES } from "@/lib/tools-data";


const BASE_URL = "https://jobly-five.lovable.app";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

function latestLastmod(dates: string[]): string | undefined {
  return dates.length > 0 ? dates.slice().sort().at(-1) : undefined;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        // Section hubs are listed only once at least one of their children is published.
        const publishedGuides = GUIDES.filter((g) => g.published);
        const publishedGuideArticles = GUIDE_ARTICLES.filter((a) => a.published);
        const publishedVs = VS_PAGES.filter((p) => p.published);
        const guidesLastmod = latestLastmod([
          ...publishedGuides.map((g) => g.lastUpdated),
          ...publishedGuideArticles.map((a) => a.lastUpdated),
        ]);
        const vsLastmod = latestLastmod(publishedVs.map((p) => p.lastUpdated));

        const entries: SitemapEntry[] = [

          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/blog", changefreq: "weekly", priority: "0.8" },
          { path: "/contact", changefreq: "monthly", priority: "0.6" },
          { path: "/legal/terms", changefreq: "yearly", priority: "0.3" },
          { path: "/legal/privacy", changefreq: "yearly", priority: "0.3" },
          { path: "/legal/cookies", changefreq: "yearly", priority: "0.3" },
          { path: "/legal/billing", changefreq: "yearly", priority: "0.3" },
          { path: "/legal/cancellation", changefreq: "yearly", priority: "0.3" },
          { path: "/legal/email", changefreq: "yearly", priority: "0.3" },
          { path: "/legal/dmca", changefreq: "yearly", priority: "0.3" },
          { path: "/legal/disclaimer", changefreq: "yearly", priority: "0.3" },
          ...PUBLISHED_BLOG_POSTS.map((p) => ({
            path: `/blog/${p.slug}`,
            lastmod: p.date,
            changefreq: "monthly" as const,
            priority: "0.7",
          })),
          // Guides + comparison pages appear automatically once `published` flips to true.
          ...(guidesLastmod
            ? [{ path: "/guides", lastmod: guidesLastmod, changefreq: "weekly" as const, priority: "0.8" }]
            : []),
          ...publishedGuides.map((g) => ({
            path: `/guides/${g.slug}`,
            lastmod: g.lastUpdated,
            changefreq: "monthly" as const,
            priority: "0.7",
          })),
          ...publishedGuideArticles.map((a) => ({
            path: `/guides/${a.guide}/${a.slug}`,
            lastmod: a.lastUpdated,
            changefreq: "monthly" as const,
            priority: "0.6",
          })),
          ...(vsLastmod
            ? [{ path: "/vs", lastmod: vsLastmod, changefreq: "weekly" as const, priority: "0.8" }]
            : []),
          ...publishedVs.map((p) => ({
            path: `/vs/${p.slug}`,
            lastmod: p.lastUpdated,
            changefreq: "monthly" as const,
            priority: "0.6",
          })),
          // Features + tools follow the same `published` switch.
          ...FEATURE_PAGES.filter((p) => p.published).map((p) => ({
            path: `/features/${p.slug}`,
            lastmod: p.lastUpdated,
            changefreq: "monthly" as const,
            priority: "0.7",
          })),
          ...TOOL_PAGES.filter((p) => p.published).map((p) => ({
            path: `/tools/${p.slug}`,
            lastmod: p.lastUpdated,
            changefreq: "monthly" as const,
            priority: "0.7",
          })),


        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
