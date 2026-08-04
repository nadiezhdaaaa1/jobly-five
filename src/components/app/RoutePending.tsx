import { AppHeader, MobileTabBar } from "@/components/app/AppNav";

/**
 * Shown while a route transition is still resolving. Renders the persistent
 * chrome immediately so a tab switch never leaves the previous page on screen.
 */
export function RoutePending() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto w-full max-w-[1280px] px-4 py-6 md:px-6">
        <div className="h-6 w-48 animate-pulse rounded-[4px] bg-muted" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-[8px] bg-muted" />
          ))}
        </div>
      </main>
      <MobileTabBar />
    </div>
  );
}
