import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  FREE_ENTITLEMENTS,
  PRO_DEMO_ENTITLEMENTS,
  clearLegacyPlanKeys,
  demoForcePro,
  fetchEntitlements,
  toSubscription,
  type Entitlements,
} from "@/lib/entitlements";
import { hydrateSubscription, setEntitlementsReady } from "@/lib/plan-store";

type Ctx = {
  entitlements: Entitlements;
  /** True until the server has answered. Callers must treat the user as Free. */
  loading: boolean;
  error: boolean;
  refetch: () => Promise<void>;
};

const EntitlementContext = createContext<Ctx>({
  entitlements: FREE_ENTITLEMENTS,
  loading: true,
  error: false,
  refetch: async () => {},
});

export function EntitlementProvider({ children }: { children: React.ReactNode }) {
  const [entitlements, setEntitlements] = useState<Entitlements>(FREE_ENTITLEMENTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (demoForcePro()) {
      setEntitlements(PRO_DEMO_ENTITLEMENTS);
      hydrateSubscription(toSubscription(PRO_DEMO_ENTITLEMENTS), true);
      setLoading(false);
      return;
    }
    try {
      const e = await fetchEntitlements();
      setEntitlements(e);
      setError(false);
      hydrateSubscription(toSubscription(e), e.status !== "none");
    } catch {
      // Fail closed: unknown state is Free.
      setEntitlements(FREE_ENTITLEMENTS);
      setError(true);
      hydrateSubscription(toSubscription(FREE_ENTITLEMENTS), false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearLegacyPlanKeys();
    setEntitlementsReady(false);
    void load();
  }, [load]);

  const value = useMemo<Ctx>(
    () => ({ entitlements, loading, error, refetch: load }),
    [entitlements, loading, error, load],
  );

  return <EntitlementContext.Provider value={value}>{children}</EntitlementContext.Provider>;
}

export function useEntitlements() {
  return useContext(EntitlementContext);
}
