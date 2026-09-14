import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { InteractionKind } from "@/lib/job-interactions-store";

/**
 * Confirmation for the two irreversible-after-reload feed actions.
 * Dislike / report hides the job everywhere; Undo only works until reload.
 */
export function HideJobDialog({
  open,
  kind,
  reason,
  jobTitle,
  wasSaved,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  kind: InteractionKind;
  reason?: string;
  jobTitle: string;
  wasSaved?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const reported = kind === "reported";
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <DialogContent className="max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{reported ? "Report this job?" : "Hide this job?"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-[14px] font-light leading-[1.6] text-[color:var(--color-text-secondary)]">
          <p>
            <span className="font-semibold text-[color:var(--color-foreground)]">{jobTitle}</span>{" "}
            will be hidden from your Digest and your Tracker
            {reason ? <> — reason: “{reason}”.</> : "."}
          </p>
          {wasSaved ? <p>It will also be removed from your Saved column.</p> : null}
          <p>You can undo this right after, but once you reload the page it cannot be undone.</p>
        </div>
        <DialogFooter>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-10 items-center rounded-[12px] border px-4 text-[14px] font-semibold hover:bg-[color:var(--color-surface-2)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-10 items-center rounded-[12px] px-4 text-[14px] font-semibold"
            style={
              reported
                ? { background: "var(--color-danger)", color: "#fff" }
                : { background: "var(--color-accent)", color: "var(--color-on-accent)" }
            }
          >
            {reported ? "Report and hide" : "Hide job"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
