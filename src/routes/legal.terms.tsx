import { createFileRoute } from "@tanstack/react-router";
import { Header } from "../components/site/Header";
import { Footer } from "../components/site/Footer";
import { LegalLayout } from "../components/legal/LegalLayout";
import { LEGAL_DOCS } from "../lib/legal-data";

const CANONICAL = "https://jobly-five.lovable.app/legal/terms";

export const Route = createFileRoute("/legal/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Jobly" },
      { name: "description", content: "The rules that govern using Jobly." },
      { property: "og:title", content: "Terms of Service — Jobly" },
      { property: "og:description", content: "The rules that govern using Jobly." },
      { property: "og:url", content: CANONICAL },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
  }),
  component: () => (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <Header />
      <main>
        <LegalLayout doc={LEGAL_DOCS.terms} />
      </main>
      <Footer />
    </div>
  ),
});
