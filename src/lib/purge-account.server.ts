// The single hard-delete path for one account. Both the nightly cron route and
// the dev-only purge tool call this, so the two can never drift.

import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Hard-deletes one account: avatar and resume objects, user_job_state,
 * user_roles, the profile row, then the auth user (FK cascades cover the rest).
 * Never checks the grace window — callers own that policy.
 */
export async function purgeAccount(userId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    for (const bucket of ["avatars", "resumes"]) {
      const { data: files } = await supabaseAdmin.storage.from(bucket).list(userId);
      if (files?.length) {
        await supabaseAdmin.storage.from(bucket).remove(files.map((f) => `${userId}/${f.name}`));
      }
    }
    await supabaseAdmin.from("user_job_state").delete().eq("user_id", userId);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    await supabaseAdmin.from("profiles").delete().eq("id", userId);
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) throw authError;
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
