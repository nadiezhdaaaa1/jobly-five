import { useRouterState } from "@tanstack/react-router";
import { AppHeader, MobileTabBar, type AppTab } from "@/components/app/AppNav";

function tabFromPath(pathname: string): AppTab {
  if (pathname.startsWith("/tracker")) return "tracker";
  if (pathname.startsWith("/resume")) return "resume";
  if (pathname.startsWith("/profile")) return "profile";
  if (pathname.startsWith("/settings")) return "settings";
  return "digest";
}

/**
 * Shown while a route transition is still resolving. Renders the persistent
 * chrome immediately so a tab switch never leaves the previous page on screen.
 */
export function RoutePending() {
  // Use the destination path so the pending frame already highlights the tab
  // the user just clicked.
  const pathname = useRouterState({
    select: (s) => s.location.pathname,
  });
  const active = tabFromPath(pathname);
  return (
    <div className="min-h-screen bg-background">
      <AppHeader active={active} />
      <main className="mx-auto w-full max-w-[1280px] px-4 py-6 md:px-6">
        <div className="h-6 w-48 animate-pulse rounded-[4px] bg-muted" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-[8px] bg-muted" />
          ))}
        </div>
      </main>
      <MobileTabBar active={active} />
    </div>
  );
}
