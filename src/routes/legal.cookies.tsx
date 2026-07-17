import { createFileRoute } from "@tanstack/react-router";
import { Header } from "../components/site/Header";
import { Footer } from "../components/site/Footer";
import { LegalLayout } from "../components/legal/LegalLayout";
import { LEGAL_DOCS } from "../lib/legal-data";

const CANONICAL = "https://jobly-five.lovable.app/legal/cookies";

export const Route = createFileRoute("/legal/cookies")({
  head: () => ({
    meta: [
      { title: "Cookie Policy — Jobly" },
      { name: "description", content: "How and why Jobly uses cookies and similar technologies." },
      { property: "og:title", content: "Cookie Policy — Jobly" },
      { property: "og:description", content: "How and why Jobly uses cookies and similar technologies." },
      { property: "og:url", content: CANONICAL },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
  }),
  component: () => (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <Header />
      <main>
        <LegalLayout doc={LEGAL_DOCS.cookies} />
      </main>
      <Footer />
    </div>
  ),
});
