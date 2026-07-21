import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { IconLoader2 as Loader2 } from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Jobly" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    setError(null);
    setSubmitting(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (err) return setError(err.message);
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <header className="pt-6 pb-6">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <Link to="/" className="text-[30px] font-bold text-[color:var(--color-green)]" style={{ fontFamily: "var(--font-logo)" }}>
            jobly
          </Link>
        </div>
      </header>
      <main className="mx-auto flex max-w-md flex-col px-4 py-10 sm:py-16">
        <h1 className="text-3xl sm:text-4xl">Set a new password</h1>
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3" noValidate>
          <label className="block">
            <span className="text-sm font-light text-[#090B0C]">New password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className={cn(
                "mt-1.5 h-12 w-full rounded-[4px] border bg-[color:var(--color-surface-1)] px-3.5 text-[15px] outline-none placeholder:text-[color:var(--color-text-muted)] focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2",
                error ? "border-[color:var(--color-danger)]" : "border-[color:var(--color-border)]"
              )}
            />
          </label>
          {error && <span className="text-sm text-[color:var(--color-danger)]">{error}</span>}
          <button
            type="submit"
            disabled={submitting}
            className="button-medium inline-flex h-12 items-center justify-center gap-2 rounded-button px-5 transition-colors bg-[color:var(--color-primary)] text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)] disabled:opacity-50"
          >
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : "Save password"}
          </button>
        </form>
      </main>
    </div>
  );
}