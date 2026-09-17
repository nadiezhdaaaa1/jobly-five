// The one locked screen for a page an account has no plan for. Extracted from
// the Tracker, which had the only copy of this markup; Digest, Tracker and
// Profile all render this component and differ only in the two strings.
//
// This is NOT the onboarding gate. It never asks about quiz answers, and it is
// never shown to someone mid-onboarding — that is a separate concern living in
// OnboardingGate, deliberately kept apart.

import { Link } from "@tanstack/react-router";

import { AppHeader, MobileTabBar, type AppTab } from "@/components/app/AppNav";
import proCube from "@/assets/pro-cube.png.asset.json";

/** The one destination and the one action — same label on every page. */
const CTA_LABEL = "See plans";

export function PlanLockedScreen({
  active,
  heading,
  body,
}: {
  /** Which nav tab is highlighted; every tab stays clickable. */
  active: AppTab;
  heading: string;
  body: string;
}) {
  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <AppHeader active={active} />
      <main className="mx-auto max-w-[1200px] px-6 pt-6">
        <div className="mx-auto w-full max-w-[672px] rounded-[24px] bg-[#F1F3F3] p-[16px]">
          <div
            data-plan-locked
            className="relative isolate flex flex-col items-center justify-center overflow-hidden rounded-[16px] border border-white bg-white/80"
            style={{
              boxShadow: "0 1px 4px rgba(12, 12, 13, 0.05)",
              gap: 32,
              padding: "49px 33px",
            }}
          >
            <style>{`
              @media (max-width: 767px) {
                [data-plan-locked] { padding: 40px 24px !important; gap: 24px !important; }
                [data-plan-locked] [data-pl-illus] { width: 96px !important; height: 96px !important; }
                [data-plan-locked] [data-pl-text] { padding-left: 0 !important; padding-right: 0 !important; }
                [data-plan-locked] [data-pl-headline] { font-size: 20px !important; line-height: 28px !important; }
                [data-plan-locked] [data-pl-glow] { width: 200px !important; height: 200px !important; bottom: -132px !important; }
                [data-plan-locked] [data-pl-btn] { width: 100% !important; }
              }
            `}</style>
            <div
              data-pl-glow
              aria-hidden
              className="pointer-events-none absolute"
              style={{
                zIndex: 1,
                left: "50%",
                bottom: "-184.5px",
                transform: "translateX(-50%)",
                width: 280,
                height: 280,
                background: "radial-gradient(circle, #00F1A9 0%, rgba(0,241,169,0) 70%)",
                filter: "blur(56px)",
                opacity: 0.45,
              }}
            />
            <img
              data-pl-illus
              src={proCube.url}
              alt=""
              aria-hidden
              className="pointer-events-none object-contain"
              style={{ position: "relative", zIndex: 4, width: 128, height: 128 }}
            />
            <div
              data-pl-text
              className="relative flex flex-col items-center text-center"
              style={{ zIndex: 3, gap: 8, paddingLeft: 40, paddingRight: 40 }}
            >
              <h1
                data-pl-headline
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 400,
                  fontSize: 24,
                  lineHeight: "32px",
                  color: "#090B0C",
                }}
              >
                {heading}
              </h1>
              <p style={{ fontWeight: 300, fontSize: 14, lineHeight: "20px", color: "#67787C" }}>
                {body}
              </p>
            </div>
            <Link
              data-pl-btn
              to="/settings"
              /* Design-system accent button; 46px rendered height sits at
                 radius 12 on the ladder, overridden inline over the class. */
              className="relative shrink-0 inline-flex items-center justify-center whitespace-nowrap main_accent_button main_accent_button--on-light button-small"
              style={{ zIndex: 2, borderRadius: 12, height: 46, padding: "0 17px", fontSize: 14, justifyContent: "center" }}
            >
              {CTA_LABEL}
            </Link>
          </div>
        </div>
      </main>
      <MobileTabBar active={active} />
    </div>
  );
}

/** The three locked screens, copy in one place. */
export const PLAN_LOCKED_COPY = {
  digest: {
    heading: "Your scored matches land here",
    body: "Pick a plan and every match arrives ranked, with ghost jobs filtered out.",
  },
  tracker: {
    heading: "Your applications belong here",
    body: "Pick a plan to move each one through its stages and keep interviews and follow-ups in one board.",
  },
  profile: {
    heading: "Your resume and match settings live here",
    body: "Pick a plan to tailor resumes for different roles and sharpen how matches are scored.",
  },
} as const;
