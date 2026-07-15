type Props = {
  value: number;
  label: string;
  size?: number;
  strokeWidth?: number;
};

export function ScoreRing({ value, label, size = 72, strokeWidth = 6 }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--color-surface-2)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--color-green)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[color:var(--color-green)]" style={{ fontFamily: "var(--font-display)", fontSize: size >= 72 ? 18 : 14 }}>
            {value}%
          </span>
        </div>
      </div>
      <span className="text-xs text-[color:var(--color-text-secondary)]">{label}</span>
    </div>
  );
}