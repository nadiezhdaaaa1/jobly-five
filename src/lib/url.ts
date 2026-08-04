/** Shared link helpers so every URL field in the app validates the same way. */

/** Accepts "example.com" and returns a normalised absolute https URL, or null. */
export function normalizeUrl(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  if (/\s/.test(v)) return null;
  const withProto = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(withProto);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    const host = u.hostname;
    if (!host.includes(".") || host.startsWith(".") || host.endsWith(".")) return null;
    // Require a plausible TLD (letters, 2+ chars).
    const tld = host.split(".").pop() ?? "";
    if (!/^[a-z]{2,}$/i.test(tld)) return null;
    return u.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function prettyUrl(url: string) {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

/**
 * Returns an error message for a link field, or null when it's acceptable.
 * Empty is allowed unless `required`.
 */
export function urlError(raw: string, opts?: { required?: boolean }): string | null {
  const v = raw.trim();
  if (!v) return opts?.required ? "Add a link." : null;
  if (!normalizeUrl(v)) return "That doesn't look like a valid link.";
  return null;
}
