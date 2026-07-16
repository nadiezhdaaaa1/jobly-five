import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Jobly" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPlaceholder,
});

function DashboardPlaceholder() {
  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <header className="border-b border-[color:var(--color-border)]">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link to="/" className="text-lg" style={{ fontFamily: "var(--font-display)" }}>
            Jobly
          </Link>
          <Link
            to="/login"
            className="text-sm text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-foreground)] rounded-[10px] px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2"
          >
            Log out
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <p className="text-sm text-[color:var(--color-green)] font-semibold">
          Welcome to Jobly
        </p>
        <h1 className="mt-1 text-3xl sm:text-4xl">Your dashboard</h1>
        <p className="mt-3 max-w-xl text-[color:var(--color-text-secondary)]">
          Your personal cabinet lives here — saved matches, digest settings, and profile
          preferences. We'll build it out next.
        </p>

        <div className="mt-8 rounded-[14px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-6">
          <h2 className="text-xl">First digest on the way</h2>
          <p className="mt-2 text-[color:var(--color-text-secondary)]">
            Check your inbox within 24 hours for your first five ranked matches.
          </p>
          <Link
            to="/matches"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-[10px] px-5 text-sm font-semibold bg-[color:var(--color-primary)] text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2"
          >
            Preview your matches
          </Link>
        </div>
      </main>
    </div>
  );
}