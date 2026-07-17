## Overview

Add 4 new page types to Jobly, reusing the existing landing style (header, footer, tokens, fonts, buttons, cards). Total routes added: `/blog`, `/blog/$slug`, `/contact`, `/legal/terms`, `/legal/privacy`, `/legal/cookies`, `/legal/refund`, `/legal/disclaimer`. Content is mock/placeholder, structured so real content can drop in later.

## Shared refactor

1. Extract `Header` and `Footer` from `src/routes/index.tsx` into `src/components/site/Header.tsx` and `src/components/site/Footer.tsx` so all new pages share them (also updates the landing to import them — no visual change).
2. Add "Blog" and "Contact" to header nav. Extend footer with Blog, Contact, and the 5 legal links.

## Data layer (mock, easily swappable)

- `src/lib/blog-data.ts` — exports `BLOG_CATEGORIES` (the 5 categories), `BLOG_POSTS` array (~15 posts) with `{ slug, title, deck, category, coverImage, author, date, readTime, body }` where `body` is a structured array of blocks (`heading`, `paragraph`, `image`, `blockquote`, `table`, `callout`) so it renders without a markdown/MDX pipeline. Cover images reuse existing `src/assets/*` art (hero, how_*, t*, etc.) — no new image generation.
- `src/lib/legal-data.ts` — 5 legal documents keyed by slug, each with `title`, `lastUpdated`, and section blocks (heading + paragraphs/lists). Clearly-marked placeholder copy.
- `src/lib/faq-data.ts` — a handful of "Before you write" FAQ entries for the contact page.

## Shared building blocks (new, small)

- `src/components/blog/BlogCard.tsx` — card used by blog list and "Related articles".
- `src/components/blog/CategoryChip.tsx` — filter chip reusing the accent style.
- `src/components/blog/ArticleBody.tsx` — renders the structured block array (h2/h3 with `id` slugs, paragraph, image+caption, blockquote, table, callout with mint bg + green text). Content max-width ~680px.
- `src/components/blog/TableOfContents.tsx` — auto-builds TOC from headings, sticky sidebar on `lg+`, `<details>` collapsible on mobile, smooth-scroll, active-section highlight via IntersectionObserver.
- `src/components/blog/ShareRow.tsx` — copy link + X/LinkedIn/Facebook share links.
- `src/components/legal/LegalLayout.tsx` — shared wrapper: H1, "Last updated", TOC (same behavior as article TOC), body renderer, cross-links block with the other 4 legal pages.
- `src/components/site/CtaBlock.tsx` — accent CTA card ("Set up your matches" → `/quiz`), reused by blog list, article end, and any other page needing it.

## Page 1 — `/blog` (`src/routes/blog.index.tsx`)

- Page header (title + subtitle).
- Category chip row: "All" + 5 categories, client-state filter.
- Card grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`, 9 visible per page.
- Load more: IntersectionObserver on a sentinel triggers `setVisible(v => v + 9)`, plus an explicit "Load more" button as fallback (both increment the same counter).
- CTA block before footer.
- `head()`: title, description, canonical (`/blog`), og/twitter tags.

## Page 2 — `/blog/$slug` (`src/routes/blog.$slug.tsx`)

- Loader: look up post from `BLOG_POSTS` by `params.slug`; `throw notFound()` if missing (route gets `notFoundComponent`).
- Layout: 2-col on `lg+` (sticky TOC left ~240px + article max-w-[680px]); single column mobile with collapsible TOC above body.
- Header: category pill, H1, deck, author/date/read-time meta, cover image.
- Body via `ArticleBody`.
- `ShareRow` near the top.
- Related: 3 same-category cards (fallback to latest others).
- End CTA block → `/quiz`.
- `head()` from loader data: title, description (deck), canonical, og/twitter (image = cover), plus JSON-LD `Article` and `BreadcrumbList` via `scripts`.

## Page 3 — `/contact` (`src/routes/contact.tsx`)

- Form (Name, Email, Subject, Message) with `zod` validation, inline errors, submit disabled until valid, focus-visible rings on all fields.
- States: `idle | submitting | success | error`. Submit is stubbed: `setTimeout` ~800ms, then success. A hidden dev toggle (dice roll) can trigger the error state; simplest is to always succeed and provide retry only if we simulate a failure — I'll keep it always-success with an error-state UI branch present but unreachable in the stub (documented in code so real submit slots in).
- Success message replaces the form.
- "Before you write" section: shadcn `Accordion` with FAQ entries; each answer links out where relevant.
- `head()` meta.

## Page 4 — Legal (5 routes)

- `src/routes/legal.terms.tsx`, `legal.privacy.tsx`, `legal.cookies.tsx`, `legal.refund.tsx`, `legal.disclaimer.tsx`. Each is a thin file: `createFileRoute` + `head()` + `<LegalLayout doc={LEGAL_DOCS.terms} />` etc.
- `LegalLayout` renders H1, "Last updated: …", sticky TOC (desktop) / collapsible (mobile), body with anchor links on each heading (icon on hover), and a cross-links block to the other four.
- Indexable (no `noindex`). Canonical per page.

## Navigation & footer

- Header nav on desktop: Home, Blog, Contact, Log in. Mobile menu updated to include Blog/Contact.
- Footer: existing columns extended with Blog and Contact links, plus a "Legal" column listing all 5 legal pages.

## Accessibility & responsive

- Semantic `<main>`, single H1 per page, heading order.
- All interactive targets ≥44px on mobile.
- Focus-visible ring uses `--ring` token.
- `alt` text on all images (from post/legal data).
- TOC uses `<nav aria-label="On this page">`.
- Chip filter uses `role="radiogroup"` + `aria-pressed`.

## Technical notes

- Filenames use TanStack dot convention: `blog.index.tsx`, `blog.$slug.tsx`, `legal.terms.tsx`, etc. `routeTree.gen.ts` regenerates automatically.
- Content types (`BlogPost`, `LegalDoc`, `ContentBlock`) exported so a future CMS/MDX pipeline can produce the same shape.
- No backend calls, no new packages required (reuse `zod` and shadcn primitives already in the project).
- No new image generation; blog cover images pull from existing assets. Real assets can replace them later by editing `blog-data.ts`.

## Deliverables

~20 new files (8 route files, ~7 shared components, 3 data modules, 2 site components extracted). Zero visual change to existing pages beyond the header/footer nav additions.