const chipClass = (active: boolean) =>
  "inline-flex h-9 items-center rounded-button border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] " +
  (active
    ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)]"
    : "border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] text-[color:var(--color-text-secondary)] hover:border-[color:var(--color-border-strong)] hover:text-[color:var(--color-foreground)]");

export function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  /** Omit when the chip is wrapped in a <Link> — it then renders as a span. */
  onClick?: () => void;
}) {
  if (!onClick) {
    return (
      <span aria-current={active ? "page" : undefined} className={chipClass(active)}>
        {label}
      </span>
    );
  }

  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={chipClass(active)}>
      {label}
    </button>
  );
}