import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { RoutePending } from "./components/app/RoutePending";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // Prefetch the target route's chunk while the pointer is on a nav item.
    defaultPreload: "intent",
    // If a transition still needs a moment, show the destination frame with
    // skeletons instead of freezing on the previous page.
    defaultPendingComponent: RoutePending,
    defaultPendingMs: 150,
    defaultPendingMinMs: 300,
  });

  return router;
};
