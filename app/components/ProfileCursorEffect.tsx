"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getAccentHex } from "@/lib/profile-themes";

interface ProfileCursorEffectProps {
  children: React.ReactNode;
  cursorStyle?: string;
  accentColor?: string;
}

export default function ProfileCursorEffect({
  children,
  cursorStyle,
  accentColor,
}: ProfileCursorEffectProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [trail, setTrail] = useState<{ x: number; y: number; id: number }[]>([]);
  const [isHovering, setIsHovering] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const trailIdRef = useRef(0);
  const rafRef = useRef<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const fn = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  const color = getAccentHex(accentColor);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setIsHovering(true);
        setPos({ x: e.clientX, y: e.clientY });
        if (cursorStyle === "trail") {
          setTrail((prev) => [
            ...prev.slice(-5),
            { x: e.clientX, y: e.clientY, id: ++trailIdRef.current },
          ]);
        }
      });
    },
    [cursorStyle]
  );

  const handleMouseEnter = useCallback(() => setIsHovering(true), []);
  const handleMouseLeave = useCallback(() => {
    // Intentionally no-op: hide only when pointer leaves the window (document mouseout).
    // Moving to the background area should keep our custom cursor visible.
  }, []);

  useEffect(() => {
    if (cursorStyle !== "glow" && cursorStyle !== "trail") return;
    const handleGlobalMouseOut = (e: MouseEvent) => {
      const to = (e as unknown as { relatedTarget: Node | null }).relatedTarget;
      if (!to || !document.body.contains(to)) {
        setIsHovering(false);
        setPos(null);
        setTrail([]);
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setIsHovering(false);
        setPos(null);
        setTrail([]);
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    document.documentElement.addEventListener("mouseout", handleGlobalMouseOut);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.documentElement.removeEventListener("mouseout", handleGlobalMouseOut);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [cursorStyle, handleMouseMove]);

  useEffect(() => {
    if (cursorStyle !== "trail" || trail.length === 0) return;
    const t = setTimeout(() => setTrail((prev) => prev.slice(1)), 120);
    return () => clearTimeout(t);
  }, [cursorStyle, trail.length]);

  const showEffect =
    !reducedMotion &&
    (cursorStyle === "glow" || cursorStyle === "trail") &&
    isHovering;

  const cursorMarkup =
    showEffect && cursorStyle === "glow" && pos ? (
      <div
        className="fixed pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          left: pos.x,
          top: pos.y,
          width: 96,
          height: 96,
          background: `radial-gradient(circle, ${color}35 0%, ${color}15 35%, transparent 65%)`,
        }}
      />
    ) : showEffect && cursorStyle === "trail" && pos ? (
      <>
        {trail.map((t) => (
          <div
            key={t.id}
            className="fixed pointer-events-none z-[9998] -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-300"
            style={{
              left: t.x,
              top: t.y,
              width: 40,
              height: 40,
              background: `radial-gradient(circle, ${color}40 0%, ${color}15 50%, transparent 70%)`,
              opacity: 0.7,
            }}
          />
        ))}
        <div
          className="fixed pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: pos.x,
            top: pos.y,
            width: 10,
            height: 10,
            background: color,
            boxShadow: `0 0 16px ${color}90, 0 0 32px ${color}50`,
          }}
        />
      </>
    ) : null;

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative"
    >
      {children}
      {typeof document !== "undefined" &&
        document.body &&
        createPortal(cursorMarkup, document.body)}
    </div>
  );
}
