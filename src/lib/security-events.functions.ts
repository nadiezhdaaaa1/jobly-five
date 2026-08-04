import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SecurityEventName =
  | "identity_unlinked"
  | "identity_unlink_refused"
  | "password_changed"
  | "password_set";

const EVENT_NAMES: SecurityEventName[] = [
  "identity_unlinked",
  "identity_unlink_refused",
  "password_changed",
  "password_set",
];

/**
 * Append-only audit trail for account security actions. The row is written with
 * server credentials after the caller's token is verified, and always scoped to
 * that caller's own id. IP and user agent are read from the request, never sent
 * by the client.
 */
export const logSecurityEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { event: SecurityEventName; reason?: string }) => {
    if (!EVENT_NAMES.includes(input.event)) {
      throw new Error("Unknown security event");
    }
    return { event: input.event, reason: input.reason?.slice(0, 200) ?? null };
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const forwarded = getRequestHeader("x-forwarded-for") ?? "";
    const ip = forwarded.split(",")[0]?.trim() || null;
    const { error } = await supabaseAdmin.from("security_events").insert({
      user_id: context.userId,
      event: data.event,
      reason: data.reason,
      ip_address: ip,
      user_agent: getRequestHeader("user-agent") ?? null,
    } as never);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/**
 * When the caller last changed or set a password. `null` means we have no
 * record — the UI must say so rather than invent a date.
 */
export const getLastPasswordChange = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ at: string | null }> => {
    const { data } = await context.supabase
      .from("security_events")
      .select("created_at, event")
      .eq("user_id", context.userId)
      .in("event", ["password_changed", "password_set"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return { at: (data?.created_at as string | undefined) ?? null };
  });
