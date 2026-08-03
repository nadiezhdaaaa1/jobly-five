import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  RESUME_BUCKET,
  RESUME_CONSENT_WORDING,
  RESUME_MAX_BYTES,
  deleteResumeDocument,
  getResumeDownloadUrl,
  registerResume,
  setPrimaryResumeDocument,
} from "@/lib/resume-documents.functions";

export { RESUME_CONSENT_WORDING, RESUME_MAX_BYTES };

export type ResumeDocument = {
  id: string;
  originalFilename: string;
  sizeBytes: number;
  isPrimary: boolean;
  createdAt: string;
};

export type UploadErrorCode =
  | "bad_type"
  | "too_large"
  | "empty"
  | "not_pdf"
  | "not_docx"
  | "cap"
  | "no_consent"
  | "missing_object"
  | "server";

export const UPLOAD_ERROR_COPY: Record<UploadErrorCode, string> = {
  bad_type: "Only PDF and DOCX files are supported.",
  too_large: "That file is larger than 5 MB.",
  empty: "That file is empty. Pick another one.",
  not_pdf: "That file isn't a valid PDF.",
  not_docx: "That file isn't a valid DOCX.",
  cap: "You can store up to 10 resumes. Delete one to upload another.",
  no_consent: "Please agree to resume storage before uploading.",
  missing_object: "Upload failed. Nothing was saved — try again.",
  server: "Upload failed. Nothing was saved — try again.",
};

function extOf(filename: string): "pdf" | "docx" | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".docx")) return "docx";
  return null;
}

/** Reads the resume library from Postgres. The client stores nothing. */
export function useResumeDocuments() {
  const [docs, setDocs] = useState<ResumeDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("resume_documents")
      .select("id, original_filename, size_bytes, is_primary, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    setDocs(
      (data ?? []).map((r) => ({
        id: r.id,
        originalFilename: r.original_filename,
        sizeBytes: Number(r.size_bytes),
        isPrimary: r.is_primary,
        createdAt: r.created_at,
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { docs, loading, refresh };
}

/** Has the user ever granted resume-storage consent? */
export async function hasResumeConsent(): Promise<boolean> {
  const { data } = await supabase
    .from("consent_records")
    .select("granted")
    .eq("channel", "resume_storage")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.granted === true;
}

export type UploadResult = { ok: true } | { ok: false; code: UploadErrorCode };

/**
 * Uploads bytes straight to Storage, then asks the server to validate and
 * register them. A failed registration removes the object again.
 */
export async function uploadResume(
  file: File,
  opts: { consentWording?: string; onProgress?: (pct: number) => void } = {},
): Promise<UploadResult> {
  const ext = extOf(file.name);
  if (!ext) return { ok: false, code: "bad_type" };
  if (file.size === 0) return { ok: false, code: "empty" };
  if (file.size > RESUME_MAX_BYTES) return { ok: false, code: "too_large" };

  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { ok: false, code: "server" };

  const resumeId = crypto.randomUUID();
  const path = `${userId}/${resumeId}.${ext}`;

  opts.onProgress?.(10);
  const { error: uploadError } = await supabase.storage.from(RESUME_BUCKET).upload(path, file, {
    contentType: file.type || (ext === "pdf" ? "application/pdf" : undefined),
    upsert: false,
  });
  if (uploadError) return { ok: false, code: "server" };
  opts.onProgress?.(80);

  try {
    const res = await registerResume({
      data: {
        resumeId,
        originalFilename: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        ...(opts.consentWording ? { consentWording: opts.consentWording } : {}),
      },
    });
    if (!res.ok) {
      await supabase.storage.from(RESUME_BUCKET).remove([path]);
      return { ok: false, code: (res.code as UploadErrorCode) ?? "server" };
    }
    opts.onProgress?.(100);
    return { ok: true };
  } catch {
    await supabase.storage.from(RESUME_BUCKET).remove([path]);
    return { ok: false, code: "server" };
  }
}

/** Fresh 60-second signed URL, minted per click. */
export async function openResumeDownload(resumeId: string): Promise<boolean> {
  try {
    const res = await getResumeDownloadUrl({ data: { resumeId } });
    if (!res.ok) return false;
    window.open(res.url, "_blank", "noopener,noreferrer");
    return true;
  } catch {
    return false;
  }
}

export async function removeResume(resumeId: string): Promise<boolean> {
  try {
    const res = await deleteResumeDocument({ data: { resumeId } });
    return res.ok;
  } catch {
    return false;
  }
}

export async function makeResumePrimary(resumeId: string): Promise<boolean> {
  try {
    const res = await setPrimaryResumeDocument({ data: { resumeId } });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * One-time notice for testers whose old browser-only "library" is gone.
 * Returns true once if a legacy `jobly.resume` blob existed; the flag then
 * survives until dismissed.
 */
export function legacyResumeNoticePending(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const legacy =
      window.sessionStorage.getItem("jobly.resume") ?? window.localStorage.getItem("jobly.resume");
    if (legacy) {
      window.sessionStorage.removeItem("jobly.resume");
      window.localStorage.removeItem("jobly.resume");
      window.localStorage.setItem("jobly.resumeNotice", "1");
    }
    return window.localStorage.getItem("jobly.resumeNotice") === "1";
  } catch {
    return false;
  }
}

export function dismissLegacyResumeNotice() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem("jobly.resumeNotice");
  } catch {
    /* ignore */
  }
}
