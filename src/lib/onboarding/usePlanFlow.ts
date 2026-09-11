// The single owner of every plan surface: landing cards, the pricing section,
// and the plan step after the matches screen all call selectPlan().
//
// Rules it enforces:
//  - the choice is stored as an enum plan + cycle before anything else happens
//  - no session -> registration modal, then continue
//  - already subscribed -> Settings (Plan card). Never a second subscription.
//  - otherwise -> mock checkout

import { useCallback, useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import type { BillingCycle } from "@/lib/subscription.functions";
import {
  clearPostAuthPath,
  savePlanIntent,
  setPostAuthPath,
  type IntentPlan,
} from "@/lib/onboarding/planIntent";
import { EVENTS, track } from "@/lib/analytics";
import type { RegistrationSource } from "@/components/auth/RegistrationModal";

export const CHECKOUT_PATH = "/checkout";

export type SelectPlanInput = {
  plan: IntentPlan;
  cycle: BillingCycle;
  trial: boolean;
};

export function usePlanFlow(source: RegistrationSource) {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [pending, setPending] = useState<SelectPlanInput | null>(null);

  const goCheckout = useCallback(
    (choice: SelectPlanInput) => {
      clearPostAuthPath();
      track(EVENTS.checkoutRedirect, { plan: choice.plan, cycle: choice.cycle, source });
      void navigate({ to: CHECKOUT_PATH });
    },
    [navigate, source],
  );

  const selectPlan = useCallback(
    async (choice: SelectPlanInput) => {
      // 1. The decision is saved first, so it survives the modal, an OAuth
      //    round trip, and abandonment.
      savePlanIntent({ plan: choice.plan, cycle: choice.cycle });

      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        // 2. No session: register, then continue. Checkout never reopens the
        //    modal, so the OAuth continuation cannot loop.
        setPostAuthPath(CHECKOUT_PATH);
        setPending(choice);
        track(EVENTS.registrationModalOpened, {
          source,
          plan: choice.plan,
          cycle: choice.cycle,
        });
        setModalOpen(true);
        return;
      }

      // 3. Signed in and already paying: send them to manage what they have.
      try {
        const { data: ent } = await supabase.rpc("get_entitlements");
        const status = (ent as { status?: string } | null)?.status;
        if (status && !["none", "canceled"].includes(status)) {
          clearPostAuthPath();
          void navigate({ to: "/settings" });
          return;
        }
      } catch {
        // Unknown state falls through to checkout; the server still decides.
      }

      // 4. Signed in, no subscription: straight to checkout.
      goCheckout(choice);
    },
    [goCheckout, navigate, source],
  );

  /** Closing keeps the saved intent and navigates nowhere. */
  const closeModal = useCallback(() => {
    clearPostAuthPath();
    setModalOpen(false);
  }, []);

  /** The modal reports a live session in this tab (no OAuth redirect happened). */
  const onAuthed = useCallback(() => {
    setModalOpen(false);
    const choice = pending;
    clearPostAuthPath();
    if (choice) goCheckout(choice);
    else void navigate({ to: CHECKOUT_PATH });
  }, [goCheckout, navigate, pending]);

  return { modalOpen, selectPlan, closeModal, onAuthed, googleRedirectPath: CHECKOUT_PATH };
}
