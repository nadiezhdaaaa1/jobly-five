import { createFileRoute } from "@tanstack/react-router";
import { Header } from "../components/site/Header";
import { Footer } from "../components/site/Footer";
import { LegalLayout } from "../components/legal/LegalLayout";
import { LEGAL_DOCS } from "../lib/legal-data";

const CANONICAL = "https://jobly-five.lovable.app/legal/refund";

export const Route = createFileRoute("/legal/refund")({
  head: () => ({
    meta: [
      { title: "Refund Policy — Jobly" },
      { name: "description", content: "How refunds and auto-renewal cancellations work on Jobly." },
      { property: "og:title", content: "Refund Policy — Jobly" },
      { property: "og:description", content: "How refunds and auto-renewal cancellations work on Jobly." },
      { property: "og:url", content: CANONICAL },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
  }),
  component: () => (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <Header />
      <main>
        <LegalLayout doc={LEGAL_DOCS.refund} />
      </main>
      <Footer />
    </div>
  ),
});
