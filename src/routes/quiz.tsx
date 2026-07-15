import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "Quiz — Jobly" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: QuizStub,
});

function QuizStub() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <p className="text-sm uppercase tracking-widest text-[color:var(--color-text-muted)]">
          Coming soon
        </p>
        <h1 className="mt-3 text-4xl">Your quiz starts here</h1>
        <p className="mt-3 text-[color:var(--color-text-secondary)]">
          We're building the 2-minute profile quiz next. Check back shortly.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex h-11 items-center rounded-lg border border-[color:var(--color-border)] px-5 text-sm hover:bg-[color:var(--color-surface-2)]"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}