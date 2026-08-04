import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Safety net for the auth trigger: makes sure the signed-in user has their
 * profile, role, subscription and notification-preference rows. Idempotent —
 * existing rows are left untouched, so it is safe to call on every boot.
 */
export const ensureUserProvisioned = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase.rpc("ensure_user_provisioned");
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
