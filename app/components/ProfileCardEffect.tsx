"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface ProfileCardEffectProps {
  children: React.ReactNode;
  /** Max tilt in degrees (e.g. 8) */
  tiltIntensity?: number;
  /** Disable all effects */
  disabled?: boolean;
}

export default function ProfileCardEffect({
  children,
  tiltIntensity = 8,
  disabled = false,
}: ProfileCardEffectProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0, scale: 1 });
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [cardSize, setCardSize] = useState({ w: 1, h: 1 });
  const [isHovering, setIsHovering] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const fn = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (disabled || reducedMotion) return;
      const card = cardRef.current;
      if (!card) return;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        setCardSize({ w: rect.width, h: rect.height });
        setTransform({
          rotateX: -y * tiltIntensity,
          rotateY: x * tiltIntensity,
          scale: 1.02,
        });
      });
    },
    [disabled, reducedMotion, tiltIntensity]
  );

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setTransform({ rotateX: 0, rotateY: 0, scale: 1 });
    setMousePos(null);
    setIsHovering(false);
  }, []);

  const handleMouseEnter = useCallback(() => setIsHovering(true), []);

  const active = !disabled && !reducedMotion && isHovering;

  // Conic gradient angle for magnetic border (toward mouse)
  const borderAngle = useMemo(() => {
    if (!mousePos || !cardSize.w || !cardSize.h) return 0;
    const cx = cardSize.w / 2;
    const cy = cardSize.h / 2;
    return (Math.atan2(mousePos.x - cx, mousePos.y - cy) * 180) / Math.PI;
  }, [mousePos, cardSize]);

  return (
    <div
      ref={cardRef}
      className="profile-card-effect-wrapper relative rounded-xl overflow-hidden"
      data-active={active ? "true" : undefined}
      style={{ perspective: "1200px" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
    >
      <div
        className="profile-card-effect-inner transition-transform duration-150 ease-out will-change-transform"
        style={
          active
            ? {
                transform: `perspective(1200px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) scale(${transform.scale})`,
                transformStyle: "preserve-3d",
              }
            : {
                transform: "perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1)",
                transitionDuration: "300ms",
              }
        }
      >
        {children}
      </div>
      {/* 1. Spotlight glow that follows the mouse */}
      {active && mousePos && (
        <div
          className="profile-card-spotlight pointer-events-none absolute inset-0 rounded-[inherit] opacity-60 transition-opacity duration-150"
          style={{
            background: `radial-gradient(
              400px circle at ${mousePos.x}px ${mousePos.y}px,
              color-mix(in srgb, var(--accent) 12%, transparent) 0%,
              color-mix(in srgb, var(--accent) 4%, transparent) 25%,
              transparent 50%
            )`,
          }}
          aria-hidden
        />
      )}

      {/* 2. Glare / glossy reflection (like Card3d, VanillaTilt) */}
      {active && mousePos && (
        <div
          className="profile-card-glare pointer-events-none absolute inset-0 rounded-[inherit] opacity-40"
          style={{
            background: `radial-gradient(
              120px ellipse at ${mousePos.x}px ${mousePos.y}px,
              rgba(255,255,255,0.35) 0%,
              rgba(255,255,255,0.12) 30%,
              transparent 60%
            )`,
          }}
          aria-hidden
        />
      )}

      {/* 3. Magnetic border glow - conic gradient follows cursor */}
      {active && (
        <div
          className="profile-card-magnetic-border pointer-events-none absolute inset-0 rounded-[inherit] opacity-70"
          style={{
            background: `conic-gradient(
              from ${borderAngle}deg at 50% 50%,
              transparent 0deg,
              color-mix(in srgb, var(--accent) 35%, transparent) 30deg,
              transparent 60deg,
              color-mix(in srgb, var(--accent) 20%, transparent) 90deg,
              transparent 120deg
            )`,
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "exclude",
            WebkitMaskComposite: "xor",
            padding: "1px",
          }}
          aria-hidden
        />
      )}

    </div>
  );
}
