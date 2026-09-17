import { createFileRoute } from "@tanstack/react-router";
import { Header } from "../components/site/Header";
import { Footer } from "../components/site/Footer";
import { LegalLayout } from "../components/legal/LegalLayout";
import { LEGAL_DOCS } from "../lib/legal-data";

const CANONICAL = "https://jobly-five.lovable.app/legal/cancellation";

export const Route = createFileRoute("/legal/cancellation")({
  head: () => ({
    meta: [
      { title: "Cancellation Policy — Jobly" },
      { name: "description", content: "How cancellation, pausing, and banked days work on Jobly subscriptions." },
      { property: "og:title", content: "Cancellation Policy — Jobly" },
      { property: "og:description", content: "How cancellation, pausing, and banked days work on Jobly subscriptions." },
      { property: "og:url", content: CANONICAL },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
  }),
  component: () => (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <Header />
      <main>
        <LegalLayout doc={LEGAL_DOCS.cancellation} />
      </main>
      <Footer />
    </div>
  ),
});
