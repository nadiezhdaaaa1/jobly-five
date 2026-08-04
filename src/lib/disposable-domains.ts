// Throwaway-inbox domains rejected at signup. Client-safe (the same list is
// re-checked on the server, which is the check that actually counts).
const DISPOSABLE_DOMAINS = new Set([
  "10minutemail.com", "20minutemail.com", "33mail.com", "guerrillamail.com",
  "guerrillamail.net", "guerrillamail.org", "sharklasers.com", "grr.la",
  "mailinator.com", "mailinator.net", "maildrop.cc", "tempmail.com",
  "temp-mail.org", "tempmailo.com", "tempmail.net", "tempr.email",
  "throwawaymail.com", "yopmail.com", "yopmail.fr", "yopmail.net",
  "getnada.com", "nada.email", "dispostable.com", "trashmail.com",
  "trashmail.de", "fakeinbox.com", "mytemp.email", "mohmal.com",
  "spamgourmet.com", "spam4.me", "moakt.com", "emailondeck.com",
  "email-temp.com", "burnermail.io", "mailnesia.com", "inboxkitten.com",
  "harakirimail.com", "tempinbox.com", "discard.email", "anonbox.net",
  "mailcatch.com", "tmpmail.org", "1secmail.com", "1secmail.net",
  "byom.de", "vomoto.com", "linshiyouxiang.net", "0box.eu",
]);

export function emailDomain(email: string): string {
  return email.trim().toLowerCase().split("@")[1] ?? "";
}

export function isDisposableEmail(email: string): boolean {
  const domain = emailDomain(email);
  if (!domain) return false;
  if (DISPOSABLE_DOMAINS.has(domain)) return true;
  // Subdomains of a listed provider (e.g. foo.mailinator.com).
  for (const known of DISPOSABLE_DOMAINS) {
    if (domain.endsWith(`.${known}`)) return true;
  }
  return false;
}
