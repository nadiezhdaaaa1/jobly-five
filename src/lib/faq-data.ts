import { TRIAL_DAYS, renewalPhrase, usd, skuTotal } from "@/config/pricing";

export const CONTACT_FAQ: { q: string; a: string }[] = [
  {
    q: "How does Jobly build my matches?",
    a: "We take your role, stack, level, years, languages, locations, and salary target and rank every open listing we can find against them. Only the top five make it into your daily digest.",
  },
  {
    q: "How do I pause or stop the daily emails?",
    a: "There is an unsubscribe link at the bottom of every digest. You can also switch to a weekly cadence or pause entirely from account settings.",
  },
  {
    q: "Can I try Jobly before paying?",
    a: `Yes — the Pro monthly plan starts with ${TRIAL_DAYS} days free. Cancel before it ends and you are not billed, otherwise it continues at ${renewalPhrase("pro_monthly")}. It is the only plan with a trial: Watch and the 3- and 6-month Pro plans are direct purchases, so they start straight away.`,
  },
  {
    q: "What is the difference between Watch and Pro?",
    a: `Watch (from ${usd(skuTotal("watch_monthly"))} a month) gives you match scores, ghost-listing filtering, a weekly digest and one saved search. Pro adds the daily digest, instant alerts for top matches, the application tracker, follow-up reminders and the "found a job" pause.`,
  },
  {
    q: "I did not get my digest — what should I do?",
    a: "Check the Promotions tab or your spam folder first, then whitelist alerts@jobly.careers. If it still does not arrive, contact us here and we will investigate.",
  },
  {
    q: "Can I edit my preferences after onboarding?",
    a: "Yes. Every field in the quiz — role, stack, experience, location, salary — is editable from your account at any time. Changes apply from the next digest.",
  },
];
