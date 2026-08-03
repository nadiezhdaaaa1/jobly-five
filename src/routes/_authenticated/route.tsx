import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { hydrateTrackerFromDb, resetTrackerForSignOut } from "@/lib/tracker-store";
import { loadJobs } from "@/lib/jobs-store";
import { hydrateAccountFromDb, isPastGrace, useAccount } from "@/lib/account-store";
import { clearLocalUserData } from "@/lib/local-data";
import { RestoreAccountScreen } from "@/components/app/RestoreAccountScreen";
import { EntitlementProvider } from "@/lib/entitlements-provider";

function AuthedShell({ userId }: { userId: string }) {
  const account = useAccount();
  useEffect(() => {
    void loadJobs();
    void hydrateTrackerFromDb(userId);
    void hydrateAccountFromDb();
    return () => {
      // Clear tracker if a different user signs in on the same tab.
      resetTrackerForSignOut();
    };
  }, [userId]);
  // Grace window elapsed: the purge job owns the server side, so all we can do
  // here is wipe browser-side leftovers and drop the session.
  useEffect(() => {
    if (account.accountStatus === "pending_deletion" && isPastGrace(account)) {
      clearLocalUserData();
      void supabase.auth.signOut().then(() => {
        window.location.href = "/";
      });
    }
  }, [account]);
  // Grace window: sign-in succeeds but lands on the restore screen, not the app.
  if (account.accountStatus === "pending_deletion") return <RestoreAccountScreen />;
  return <Outlet />;
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/login" });
    }
    return { user: data.user };
  },
  component: function AuthedRoute() {
    const { user } = Route.useRouteContext();
    return (
      <EntitlementProvider>
        <AuthedShell userId={user.id} />
      </EntitlementProvider>
    );
  },
});