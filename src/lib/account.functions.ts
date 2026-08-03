import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { deletionDateFrom } from "@/config/account";

export type ServerAccountState = {
  accountStatus: "active" | "pending_deletion";
  deletionRequestedAt: string | null;
  deletionScheduledFor: string | null;
};

/** Authoritative account status for the signed-in user. */
export const getAccountState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ServerAccountState> => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("account_status, deletion_requested_at, deletion_scheduled_for")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw error;
    return {
      accountStatus: data?.account_status === "pending_deletion" ? "pending_deletion" : "active",
      deletionRequestedAt: data?.deletion_requested_at ?? null,
      deletionScheduledFor: data?.deletion_scheduled_for ?? null,
    };
  });

/** Flip the account into the grace window. Nothing is erased yet. */
export const requestDeletionOnServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { requestedAt?: string } | undefined) => input ?? {})
  .handler(async ({ data, context }): Promise<ServerAccountState> => {
    const requestedAt = data.requestedAt ? new Date(data.requestedAt) : new Date();
    const scheduledFor = deletionDateFrom(requestedAt);
    const { error } = await context.supabase
      .from("profiles")
      .update({
        account_status: "pending_deletion",
        deletion_requested_at: requestedAt.toISOString(),
        deletion_scheduled_for: scheduledFor.toISOString(),
      })
      .eq("id", context.userId);
    if (error) throw error;
    return {
      accountStatus: "pending_deletion",
      deletionRequestedAt: requestedAt.toISOString(),
      deletionScheduledFor: scheduledFor.toISOString(),
    };
  });

/** Cancel a pending deletion during the grace window. */
export const restoreAccountOnServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ServerAccountState> => {
    const { error } = await context.supabase
      .from("profiles")
      .update({
        account_status: "active",
        deletion_requested_at: null,
        deletion_scheduled_for: null,
      })
      .eq("id", context.userId);
    if (error) throw error;
    return { accountStatus: "active", deletionRequestedAt: null, deletionScheduledFor: null };
  });