import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { useAuth } from "@/hooks/use-auth";

/**
 * A marketing CTA. The quiz is the right destination for a visitor, but someone
 * already signed in has answered it — they go to their digest instead.
 *
 * The session only resolves on the client, so while `loading` this renders the
 * quiz link, which is also what the server renders: hydration matches, and the
 * href simply updates once the session is known.
 *
 * The two branches are written out rather than computing `to` from a ternary,
 * so the router keeps its literal route types.
 */
export function CtaLink({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { user, loading } = useAuth();

  if (user && !loading) {
    return (
      <Link to="/dashboard" className={className}>
        {children}
      </Link>
    );
  }

  return (
    <Link to="/quiz" className={className}>
      {children}
    </Link>
  );
}
