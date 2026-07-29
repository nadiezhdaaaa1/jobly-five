import * as React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function IconTooltip({
  label,
  children,
  side = "top",
  asChild = true,
}: {
  label: string;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  asChild?: boolean;
}) {
  if (!label) return <>{children}</>;
  return (
    <TooltipProvider delayDuration={200} skipDelayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild={asChild}>{children}</TooltipTrigger>
        <TooltipContent
          side={side}
          className="z-[200] rounded-[4px] bg-[color:var(--color-foreground)] px-2 py-1 text-[12px] font-medium text-white"
        >
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}