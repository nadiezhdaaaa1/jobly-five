import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { hydrateTrackerFromDb, resetTrackerForSignOut } from "@/lib/tracker-store";
import { loadJobs } from "@/lib/jobs-store";

function AuthedShell({ userId }: { userId: string }) {
  useEffect(() => {
    void loadJobs();
    void hydrateTrackerFromDb(userId);
    return () => {
      // Clear tracker if a different user signs in on the same tab.
      resetTrackerForSignOut();
    };
  }, [userId]);
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
    return <AuthedShell userId={user.id} />;
  },
});