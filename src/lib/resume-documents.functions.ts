import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Server side of the resume library.
 *
 * Files live in the private `resumes` bucket at `{user_id}/{resume_id}.{ext}`;
 * metadata lives in `resume_documents`. Clients never insert rows (no INSERT
 * policy) and never see a raw storage path — downloads go through short-lived
 * signed URLs minted per click.
 */

export const RESUME_BUCKET = "resumes";
export const RESUME_MAX_BYTES = 5 * 1024 * 1024;
export const RESUME_HARD_CAP = 10;

export const RESUME_CONSENT_WORDING =
  "I agree to Jobly storing this resume on my account so it can be used for job matching and applications. I can delete it at any time.";

type Ext = "pdf" | "docx";

function extOf(filename: string): Ext | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".docx")) return "docx";
  return null;
}

function magicOk(bytes: Uint8Array, ext: Ext): boolean {
  if (ext === "pdf") {
    return (
      bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d
    ); // %PDF-
  }
  return bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04; // PK\x03\x04
}

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Registers an already-uploaded object. Validates it server-side, then inserts the row. */
export const registerResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      resumeId: string;
      originalFilename: string;
      mimeType: string;
      sizeBytes: number;
      consentWording?: string;
    }) => {
      if (!UUID_RE.test(data.resumeId)) throw new Error("Invalid resume id");
      if (!data.originalFilename || data.originalFilename.length > 260) throw new Error("Invalid filename");
      return data;
    },
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const ext = extOf(data.originalFilename);
    if (!ext) return { ok: false as const, code: "bad_type" };

    const path = `${userId}/${data.resumeId}.${ext}`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const cleanup = async () => {
      await supabaseAdmin.storage.from(RESUME_BUCKET).remove([path]);
    };

    // Consent gate — recorded through consent_records, never inferred.
    const { data: consent } = await supabase
      .from("consent_records")
      .select("granted")
      .eq("channel", "resume_storage")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    let consented = consent?.granted === true;
    if (!consented && data.consentWording === RESUME_CONSENT_WORDING) {
      const { error: consentError } = await supabaseAdmin.from("consent_records").insert({
        user_id: userId,
        channel: "resume_storage",
        granted: true,
        wording: RESUME_CONSENT_WORDING,
        source: "resume_upload",
      });
      if (consentError) {
        await cleanup();
        return { ok: false as const, code: "server", message: consentError.message };
      }
      consented = true;
    }
    if (!consented) {
      await cleanup();
      return { ok: false as const, code: "no_consent" };
    }

    // Per-user cap on active resumes.
    const { count } = await supabase
      .from("resume_documents")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null);
    if ((count ?? 0) >= RESUME_HARD_CAP) {
      await cleanup();
      return { ok: false as const, code: "cap" };
    }

    // Real size from Storage — the client's number is not trusted.
    const { data: listed, error: listError } = await supabaseAdmin.storage
      .from(RESUME_BUCKET)
      .list(userId, { search: `${data.resumeId}.${ext}` });
    if (listError) return { ok: false as const, code: "server", message: listError.message };
    const object = listed?.find((o) => o.name === `${data.resumeId}.${ext}`);
    if (!object) return { ok: false as const, code: "missing_object" };
    const realSize = Number((object.metadata as { size?: number } | null)?.size ?? 0);
    if (realSize === 0 || realSize > RESUME_MAX_BYTES) {
      await cleanup();
      return { ok: false as const, code: realSize === 0 ? "empty" : "too_large" };
    }

    // Magic-number check + checksum.
    const { data: blob, error: dlError } = await supabaseAdmin.storage.from(RESUME_BUCKET).download(path);
    if (dlError || !blob) {
      await cleanup();
      return { ok: false as const, code: "server", message: dlError?.message ?? "download failed" };
    }
    const buf = await blob.arrayBuffer();
    if (!magicOk(new Uint8Array(buf.slice(0, 8)), ext)) {
      await cleanup();
      return { ok: false as const, code: ext === "pdf" ? "not_pdf" : "not_docx" };
    }
    const checksum = await sha256Hex(buf);

    const { data: existingPrimary } = await supabase
      .from("resume_documents")
      .select("id")
      .is("deleted_at", null)
      .eq("is_primary", true)
      .maybeSingle();

    const { data: row, error: insertError } = await supabaseAdmin
      .from("resume_documents")
      .insert({
        id: data.resumeId,
        user_id: userId,
        file_path: path,
        original_filename: data.originalFilename,
        mime_type: data.mimeType || (ext === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
        size_bytes: realSize,
        checksum_sha256: checksum,
        is_primary: !existingPrimary,
      })
      .select("id, original_filename, size_bytes, is_primary, created_at, mime_type")
      .single();
    if (insertError || !row) {
      await cleanup();
      return { ok: false as const, code: "server", message: insertError?.message ?? "insert failed" };
    }
    return { ok: true as const, document: row };
  });

/** Mints a 60-second signed URL. Never cached, never a public URL. */
export const getResumeDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { resumeId: string }) => {
    if (!UUID_RE.test(data.resumeId)) throw new Error("Invalid resume id");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row } = await supabase
      .from("resume_documents")
      .select("file_path")
      .eq("id", data.resumeId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!row) return { ok: false as const, code: "missing" };
    const { data: signed, error } = await supabase.storage
      .from(RESUME_BUCKET)
      .createSignedUrl(row.file_path, 60);
    if (error || !signed?.signedUrl) return { ok: false as const, code: "server" };
    return { ok: true as const, url: signed.signedUrl };
  });

/** Soft-deletes the row, removes the object, promotes a new primary if needed. */
export const deleteResumeDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { resumeId: string }) => {
    if (!UUID_RE.test(data.resumeId)) throw new Error("Invalid resume id");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row } = await supabase
      .from("resume_documents")
      .select("id, file_path, is_primary")
      .eq("id", data.resumeId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!row) return { ok: false as const, code: "missing" };

    const { error: softError } = await supabase
      .from("resume_documents")
      .update({ deleted_at: new Date().toISOString(), is_primary: false })
      .eq("id", row.id);
    if (softError) return { ok: false as const, code: "server", message: softError.message };

    const { error: storageError } = await supabase.storage.from(RESUME_BUCKET).remove([row.file_path]);
    if (storageError) {
      // The row is already gone for the user; the daily sweep collects the orphan.
      console.warn(`[resumes] orphan left behind at ${row.file_path}: ${storageError.message}`);
    }

    if (row.is_primary) {
      const { data: next } = await supabase
        .from("resume_documents")
        .select("id")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (next) {
        await supabase.from("resume_documents").update({ is_primary: true }).eq("id", next.id);
      }
    }

    return { ok: true as const, orphaned: Boolean(storageError), userId };
  });

/** Marks one resume primary; the partial unique index keeps it exclusive. */
export const setPrimaryResumeDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { resumeId: string }) => {
    if (!UUID_RE.test(data.resumeId)) throw new Error("Invalid resume id");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error: clearError } = await supabase
      .from("resume_documents")
      .update({ is_primary: false })
      .eq("is_primary", true)
      .is("deleted_at", null);
    if (clearError) return { ok: false as const, code: "server", message: clearError.message };
    const { error } = await supabase
      .from("resume_documents")
      .update({ is_primary: true })
      .eq("id", data.resumeId)
      .is("deleted_at", null);
    if (error) return { ok: false as const, code: "server", message: error.message };
    return { ok: true as const };
  });
