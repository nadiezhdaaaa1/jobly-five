import { createFileRoute } from "@tanstack/react-router";
import { Header } from "../components/site/Header";
import { Footer } from "../components/site/Footer";
import { LegalLayout } from "../components/legal/LegalLayout";
import { LEGAL_DOCS } from "../lib/legal-data";

const CANONICAL = "https://jobly-five.lovable.app/legal/billing";

export const Route = createFileRoute("/legal/billing")({
  head: () => ({
    meta: [
      { title: "Subscription & Billing Terms — Jobly" },
      { name: "description", content: "How Jobly subscriptions, trials, auto-renewal, and billing work." },
      { property: "og:title", content: "Subscription & Billing Terms — Jobly" },
      { property: "og:description", content: "How Jobly subscriptions, trials, auto-renewal, and billing work." },
      { property: "og:url", content: CANONICAL },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
  }),
  component: () => (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <Header />
      <main>
        <LegalLayout doc={LEGAL_DOCS.billing} />
      </main>
      <Footer />
    </div>
  ),
});