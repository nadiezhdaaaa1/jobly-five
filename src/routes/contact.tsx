import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Header } from "../components/site/Header";
import { Footer } from "../components/site/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import { CONTACT_FAQ } from "../lib/faq-data";

const CANONICAL = "https://jobly-five.lovable.app/contact";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Jobly — We reply within a business day" },
      { name: "description", content: "Get in touch with the Jobly team. We usually reply within a business day." },
      { property: "og:title", content: "Contact Jobly" },
      { property: "og:description", content: "Get in touch with the Jobly team. We usually reply within a business day." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: CANONICAL },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Contact Jobly" },
      { name: "twitter:description", content: "Get in touch with the Jobly team." },
    ],
    links: [{ rel: "canonical", href: CANONICAL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: CONTACT_FAQ.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: ContactPage,
});

const contactSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  subject: z.string().trim().min(1, "Please add a subject").max(150),
  message: z.string().trim().min(10, "Please add at least 10 characters").max(2000),
});

type Form = z.infer<typeof contactSchema>;
type Errors = Partial<Record<keyof Form, string>>;
type Status = "idle" | "submitting" | "success" | "error";

function ContactPage() {
  const [form, setForm] = useState<Form>({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");

  const valid = contactSchema.safeParse(form).success;

  const setField = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Form;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setStatus("submitting");
    // Stubbed submit — swap for a real endpoint later.
    await new Promise((r) => setTimeout(r, 800));
    setStatus("success");
  };

  const fieldClass =
    "mt-2 h-11 w-full rounded-[12px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-3 text-sm text-[color:var(--color-foreground)] placeholder:text-[color:var(--color-text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]";
  const errClass = "border-[color:var(--color-danger)]";

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <Header />
      <main className="border-b border-[color:var(--color-border)] bg-[color:var(--color-background)]">
        <div className="border-[color:var(--color-border)] lg:mx-12 lg:border-l lg:border-r">
          <div className="mx-auto max-w-[1200px] px-5 py-12 md:px-8 md:py-16">
              <header className="max-w-2xl">
                <h1 className="text-4xl md:text-5xl">Contact us</h1>
                <p className="mt-3 text-[color:var(--color-text-secondary)]">
                  We usually reply within a business day.
                </p>
              </header>

              <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
                <section className="rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-6 md:p-8">
                  {status === "success" ? (
                    <div className="py-6">
                      <h2 className="text-2xl">Thanks, we got your message.</h2>
                      <p className="mt-2 text-[color:var(--color-text-secondary)]">
                        We'll be in touch within one business day at <strong>{form.email}</strong>.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setForm({ name: "", email: "", subject: "", message: "" });
                          setStatus("idle");
                        }}
                        className="secondary_button secondary_button--on-light secondary_button--field mt-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
                      >
                        Send another message
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={onSubmit} noValidate>
                      {status === "error" && (
                        <div className="mb-4 rounded-[16px] border border-[color:var(--color-danger)] bg-[color:var(--color-danger-subtle)] p-3 text-sm text-[color:var(--color-danger)]">
                          Something went wrong sending your message.{" "}
                          <button type="button" onClick={() => setStatus("idle")} className="underline">
                            Try again
                          </button>
                          .
                        </div>
                      )}
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label htmlFor="name" className="text-sm">Name</label>
                          <input
                            id="name"
                            type="text"
                            required
                            value={form.name}
                            onChange={(e) => setField("name", e.target.value)}
                            className={`${fieldClass} ${errors.name ? errClass : ""}`}
                            aria-invalid={!!errors.name}
                            aria-describedby={errors.name ? "name-err" : undefined}
                          />
                          {errors.name && <p id="name-err" className="mt-1 text-xs text-[color:var(--color-danger)]">{errors.name}</p>}
                        </div>
                        <div>
                          <label htmlFor="email" className="text-sm">Email</label>
                          <input
                            id="email"
                            type="email"
                            required
                            value={form.email}
                            onChange={(e) => setField("email", e.target.value)}
                            className={`${fieldClass} ${errors.email ? errClass : ""}`}
                            aria-invalid={!!errors.email}
                            aria-describedby={errors.email ? "email-err" : undefined}
                          />
                          {errors.email && <p id="email-err" className="mt-1 text-xs text-[color:var(--color-danger)]">{errors.email}</p>}
                        </div>
                      </div>
                      <div className="mt-4">
                        <label htmlFor="subject" className="text-sm">Subject</label>
                        <input
                          id="subject"
                          type="text"
                          required
                          value={form.subject}
                          onChange={(e) => setField("subject", e.target.value)}
                          className={`${fieldClass} ${errors.subject ? errClass : ""}`}
                          aria-invalid={!!errors.subject}
                          aria-describedby={errors.subject ? "subject-err" : undefined}
                        />
                        {errors.subject && <p id="subject-err" className="mt-1 text-xs text-[color:var(--color-danger)]">{errors.subject}</p>}
                      </div>
                      <div className="mt-4">
                        <label htmlFor="message" className="text-sm">Message</label>
                        <textarea
                          id="message"
                          required
                          rows={6}
                          value={form.message}
                          onChange={(e) => setField("message", e.target.value)}
                          className={`mt-2 w-full rounded-[12px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-3 text-sm text-[color:var(--color-foreground)] placeholder:text-[color:var(--color-text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] ${errors.message ? errClass : ""}`}
                          aria-invalid={!!errors.message}
                          aria-describedby={errors.message ? "message-err" : undefined}
                        />
                        {errors.message && <p id="message-err" className="mt-1 text-xs text-[color:var(--color-danger)]">{errors.message}</p>}
                      </div>
                      <div className="mt-6">
                        <button
                          type="submit"
                          disabled={!valid || status === "submitting"}
                          className="main_accent_button main_accent_button--on-light main_accent_button--field focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
                        >
                          {status === "submitting" ? "Sending…" : "Send message"}
                        </button>
                      </div>
                    </form>
                  )}
                </section>

                <aside className="rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-6 md:p-8">
                  <h2 className="text-lg">Before you write</h2>
                  <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
                    A few things people often ask — you might find your answer faster here.
                  </p>
                  <Accordion type="single" collapsible className="mt-4">
                    {CONTACT_FAQ.map((f, i) => (
                      <AccordionItem key={i} value={`i-${i}`}>
                        <AccordionTrigger className="text-left text-sm">{f.q}</AccordionTrigger>
                        <AccordionContent className="text-sm text-[color:var(--color-text-secondary)]">{f.a}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </aside>
              </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}