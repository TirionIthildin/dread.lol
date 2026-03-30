"use client";

interface SparkleUsernameProps {
  children: React.ReactNode;
  variant: "sparkle" | "sparkle-stars";
  className?: string;
}

const SPARKLE_COUNT = 6;
const STAR_COUNT = 8;

/** Renders username with floating sparkle/star effects like inline forum signatures. */
export default function SparkleUsername({ children, variant, className = "" }: SparkleUsernameProps) {
  const count = variant === "sparkle" ? SPARKLE_COUNT : STAR_COUNT;
  const chars = variant === "sparkle" ? ["✨", "✦", "✧"] : ["⋆", "·", "⁺"];
  const size = variant === "sparkle" ? "0.6em" : "0.4em";

  return (
    <span className={`username-sparkle-wrapper inline-flex relative overflow-visible ${className}`}>
      {/* Sparkle/star elements */}
      {Array.from({ length: count }).map((_, i) => {
        const char = chars[i % chars.length];
        const pos = (i / count) * 100;
        const left = 10 + (pos * 0.8);
        const delay = (i * 0.15) % 2;
        const duration = 1.5 + (i % 3) * 0.3;
        return (
          <span
            key={i}
            className={`username-sparkle username-sparkle-${variant}`}
            style={{
              left: `${left}%`,
              top: i % 2 === 0 ? "-0.15em" : "120%",
              fontSize: size,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }}
            aria-hidden
          >
            {char}
          </span>
        );
      })}
      <span className="relative z-[1]">{children}</span>
    </span>
  );
}
