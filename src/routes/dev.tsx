// Dev-only tool panel. Not linked from anywhere: reached by typing /dev.
// The route does not exist in a production build — the loader throws notFound()
// so a production deploy 404s instead of rendering a disabled panel.

import { createFileRoute, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Header } from "../components/site/Header";
import { Footer } from "../components/site/Footer";
import { supabase } from "@/integrations/supabase/client";
import { clearUserStateForSignOut } from "@/lib/sign-out";
import {
  CHECK_FAILED,
  DEV_PURGE_ALLOWLIST,
  devPurgeAccount,
  type DevPurgeResult,
} from "@/lib/dev-purge.functions";

export const Route = createFileRoute("/dev")({
  head: () => ({
    meta: [
      { title: "Dev tools" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  loader: () => {
    if (!import.meta.env.DEV) throw notFound();
    return null;
  },
  component: DevPanel,
  errorComponent: () => <PlainMessage text="Dev panel failed to load." />,
  notFoundComponent: () => <PlainMessage text="Not found." />,
});

function PlainMessage({ text }: { text: string }) {
  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <main className="mx-auto max-w-[1200px] px-5 py-16">
        <p className="text-sm">{text}</p>
      </main>
    </div>
  );
}

function DevPanel() {
  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <Header />
      <main>
        <section className="bg-[color:var(--color-background)]">
          <div className="border-[color:var(--color-border)] lg:mx-12 lg:border-l lg:border-r">
            <div className="mx-auto max-w-[1200px] px-5 pt-12 pb-16 md:px-8">
              <h1 className="text-3xl">Dev tools</h1>
              <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
                Development build only. Not linked from the site and excluded from robots.
              </p>

              <div className="mt-8 flex flex-col gap-6">
                <PurgeCard />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

type Tone = "success" | "warning" | "neutral" | "error";

function toneClasses(tone: Tone) {
  if (tone === "success") return "border-[#0E735A] bg-[#0E735A]/5";
  if (tone === "warning") return "border-[#B45309] bg-[#B45309]/5";
  if (tone === "error") return "border-[#B42318] bg-[#B42318]/5";
  return "border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]";
}

function PurgeCard() {
  // The allowlist is the single source of truth for the target address.
  const target = DEV_PURGE_ALLOWLIST[0];
  const purge = useServerFn(devPurgeAccount);

  const [typed, setTyped] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<DevPurgeResult | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);

  const armed = typed.trim().toLowerCase() === target.toLowerCase();

  const run = async () => {
    setPending(true);
    setResult(null);
    setSessionEnded(false);
    try {
      // The typed text only arms the button. The submitted address always comes
      // from the allowlist constant, never from the input value.
      const res = await purge({ data: { email: DEV_PURGE_ALLOWLIST[0] } });
      setResult(res);

      if (res.status === "purged") {
        const { data } = await supabase.auth.getSession();
        const signedInEmail = data.session?.user?.email?.trim().toLowerCase() ?? null;
        if (signedInEmail && signedInEmail === DEV_PURGE_ALLOWLIST[0].toLowerCase()) {
          clearUserStateForSignOut();
          await supabase.auth.signOut();
          setSessionEnded(true);
        }
      }
    } catch (e) {
      setResult({
        ok: false,
        status: "error",
        message: e instanceof Error ? e.message : "Request failed.",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="rounded-[12px] border border-[color:var(--color-border)] bg-white p-5">
      <h2 className="text-lg">Purge dev account</h2>

      <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">
        Hard-deletes the auth user, the profile, storage objects and all related rows for the
        allowlisted address. This is irreversible and there is no grace window.
      </p>

      <p className="mt-3 text-sm">
        Target:{" "}
        {DEV_PURGE_ALLOWLIST.map((email) => (
          <code key={email} className="rounded bg-[color:var(--color-surface-2)] px-1.5 py-0.5">
            {email}
          </code>
        ))}
      </p>

      <label className="mt-4 block text-sm" htmlFor="dev-purge-confirm">
        Type the address above to enable the button
      </label>
      <input
        id="dev-purge-confirm"
        type="text"
        autoComplete="off"
        spellCheck={false}
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        className="mt-1 w-full max-w-[420px] rounded-[10px] border border-[color:var(--color-border)] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
      />

      <div className="mt-4">
        <button
          type="button"
          disabled={!armed || pending}
          onClick={() => void run()}
          className="danger_button--on-light disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2"
        >
          {pending ? "Purging…" : "Purge account"}
        </button>
      </div>

      {result && <PurgeResultView result={result} sessionEnded={sessionEnded} />}
    </div>
  );
}

function PurgeResultView({
  result,
  sessionEnded,
}: {
  result: DevPurgeResult;
  sessionEnded: boolean;
}) {
  const unverified = result.unverified ?? [];
  const counts = result.counts ?? {};
  const leftovers = Object.entries(counts).filter(([, n]) => typeof n === "number" && n > 0) as [
    string,
    number,
  ][];

  let tone: Tone = "neutral";
  let headline = result.message;

  if (result.status === "refused" || result.status === "error") {
    tone = "error";
  } else if (result.status === "nothing-to-purge") {
    tone = "neutral";
  } else if (unverified.length > 0 || leftovers.length > 0) {
    tone = "warning";
  } else if (result.clean === true) {
    tone = "success";
  } else {
    tone = "warning";
    headline = result.message || "Purged, but completeness was not proven.";
  }

  return (
    <div className={`mt-5 rounded-[10px] border p-4 text-sm ${toneClasses(tone)}`}>
      <p className="font-medium">{headline}</p>

      {sessionEnded && (
        <p className="mt-2">
          Your session was ended: the signed-in account no longer exists.
        </p>
      )}

      {unverified.length > 0 && (
        <div className="mt-3">
          <p className="font-medium">Unverified — completeness not proven:</p>
          <ul className="mt-1 list-disc pl-5">
            {unverified.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      {leftovers.length > 0 && (
        <div className="mt-3">
          <p className="font-medium">Rows still present:</p>
          <ul className="mt-1 list-disc pl-5">
            {leftovers.map(([t, n]) => (
              <li key={t}>
                {t}: {n}
              </li>
            ))}
          </ul>
        </div>
      )}

      {Object.keys(counts).length > 0 && (
        <div className="mt-4">
          <p className="font-medium">Verification counts (all rows)</p>
          <table className="mt-2 w-full max-w-[520px] border-collapse text-left">
            <thead>
              <tr>
                <th className="border-b border-[color:var(--color-border)] py-1 pr-4 font-normal text-[color:var(--color-text-secondary)]">
                  Table
                </th>
                <th className="border-b border-[color:var(--color-border)] py-1 font-normal text-[color:var(--color-text-secondary)]">
                  Count
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(counts).map(([table, n]) => (
                <tr key={table}>
                  <td className="border-b border-[color:var(--color-border)] py-1 pr-4">{table}</td>
                  <td className="border-b border-[color:var(--color-border)] py-1">
                    {n === CHECK_FAILED ? CHECK_FAILED : n}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
