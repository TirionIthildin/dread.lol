interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size = 24, className = "" }: LogoProps) {
  return (
    <span
      className={`inline-flex items-center justify-center font-semibold text-[var(--terminal)] drop-shadow-[0_0_8px_rgba(34,197,94,0.4)] ${className}`}
      style={{ width: size, height: size, fontSize: size }}
      aria-hidden
    >
      D
    </span>
  );
}
