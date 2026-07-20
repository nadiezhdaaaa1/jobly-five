import { createFileRoute } from "@tanstack/react-router";
import { Header } from "../components/site/Header";
import { Footer } from "../components/site/Footer";
import { LegalLayout } from "../components/legal/LegalLayout";
import { LEGAL_DOCS } from "../lib/legal-data";

const CANONICAL = "https://jobly-five.lovable.app/legal/email";

export const Route = createFileRoute("/legal/email")({
  head: () => ({
    meta: [
      { title: "Email & Communications Consent — Jobly" },
      { name: "description", content: "What messages Jobly sends, how you consent, and how to opt out." },
      { property: "og:title", content: "Email & Communications Consent — Jobly" },
      { property: "og:description", content: "What messages Jobly sends, how you consent, and how to opt out." },
      { property: "og:url", content: CANONICAL },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
  }),
  component: () => (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <Header />
      <main>
        <LegalLayout doc={LEGAL_DOCS.email} />
      </main>
      <Footer />
    </div>
  ),
});