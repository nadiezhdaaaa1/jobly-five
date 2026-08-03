import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { DELETION_COPY, formatDeletionDate } from "@/config/account";
import { restoreAccountServer, useAccount } from "@/lib/account-store";
import { clearLocalUserData } from "@/lib/local-data";
import { supabase } from "@/integrations/supabase/client";

/** Full-width screen shown when a signed-in account is pending deletion. */
export function RestoreAccountScreen() {
  const account = useAccount();
  const navigate = useNavigate();
  const date = account.deletionScheduledFor ? formatDeletionDate(account.deletionScheduledFor) : "";

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[color:var(--color-background)] px-6 py-16">
      <div className="w-full max-w-[520px] text-center">
        <h1
          className="text-[24px] text-[color:var(--color-foreground)]"
          style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
        >
          {DELETION_COPY.restoreHeadline(date)}
        </h1>
        <p className="mt-3 text-[14px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
          {DELETION_COPY.restoreBody}
        </p>
        <button
          type="button"
          onClick={async () => {
            try {
              await restoreAccountServer();
            } catch {
              toast.error("Could not restore your account. Try again.");
              return;
            }
            toast.success(DELETION_COPY.restoredToast);
            void navigate({ to: "/dashboard" });
          }}
          className="mt-7 h-11 w-full rounded-[4px] bg-[color:var(--color-green)] px-4 button-small text-white hover:opacity-90"
        >
          {DELETION_COPY.restorePrimary}
        </button>
        <button
          type="button"
          onClick={async () => {
            clearLocalUserData();
            await supabase.auth.signOut();
            window.location.href = "/";
          }}
          className="mt-4 text-[13px] text-[color:var(--color-text-secondary)] underline hover:text-[color:var(--color-foreground)]"
        >
          {DELETION_COPY.restoreSecondary}
        </button>
      </div>
    </div>
  );
}