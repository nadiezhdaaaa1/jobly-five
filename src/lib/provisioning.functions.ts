import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Safety net for the auth trigger: makes sure the signed-in user has their
 * profile, role, subscription and notification-preference rows. Idempotent —
 * existing rows are left untouched, so it is safe to call on every boot.
 *
 * The provisioning routine is not callable by signed-in users directly; it runs
 * here with server credentials only after the caller's token is verified, and
 * only ever for that caller's own id.
 */
export const ensureUserProvisioned = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const claims = context.claims as { email?: string; user_metadata?: Record<string, unknown> };
    const { error } = await supabaseAdmin.rpc("provision_user", {
      _user_id: context.userId,
      _email: claims.email ?? null,
      _meta: (claims.user_metadata ?? {}) as never,
    } as never);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
