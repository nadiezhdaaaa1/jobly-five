import googleMark from "@/assets/google.svg";

/** Brand mark used on every "Continue with Google" button and connection row. */
export function GoogleMark({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <img
      src={googleMark}
      alt=""
      aria-hidden
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size }}
    />
  );
}
