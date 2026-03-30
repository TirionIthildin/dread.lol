"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getAccentHex } from "@/lib/profile-themes";

interface ProfileCursorEffectProps {
  children: React.ReactNode;
  cursorStyle?: string;
  accentColor?: string;
}

export default function ProfileCursorEffect({ children, cursorStyle, accentColor }: ProfileCursorEffectProps) {
  const [trail, setTrail] = useState<{ x: number; y: number; id: number }[]>([]);
  const [isHovering, setIsHovering] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const trailIdRef = useRef(0);
  const glowRef = useRef<HTMLDivElement>(null);
  const trailDotRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const fn = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  const color = getAccentHex(accentColor);

  const updateCursorPosition = useCallback((x: number, y: number) => {
    posRef.current = { x, y };
    if (glowRef.current) {
      glowRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    }
    if (trailDotRef.current) {
      trailDotRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      requestAnimationFrame(() => {
        setIsHovering(true);
        updateCursorPosition(e.clientX, e.clientY);
        if (cursorStyle === "trail") {
          setTrail((prev) => [
            ...prev.slice(-5),
            { x: e.clientX, y: e.clientY, id: ++trailIdRef.current },
          ]);
        }
      });
    },
    [cursorStyle, updateCursorPosition]
  );

  const clearHover = useCallback(() => {
    setIsHovering(false);
    setTrail([]);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  useEffect(() => {
    if (cursorStyle !== "glow" && cursorStyle !== "trail") return;
    const handleGlobalMouseOut = (e: MouseEvent) => {
      const to = (e as unknown as { relatedTarget: Node | null }).relatedTarget;
      if (!to || !document.body.contains(to)) {
        clearHover();
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        clearHover();
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    document.documentElement.addEventListener("mouseout", handleGlobalMouseOut);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.documentElement.removeEventListener("mouseout", handleGlobalMouseOut);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [cursorStyle, handleMouseMove, clearHover]);

  useEffect(() => {
    if (cursorStyle !== "trail" || trail.length === 0) return;
    const t = setTimeout(() => setTrail((prev) => prev.slice(1)), 120);
    return () => clearTimeout(t);
  }, [cursorStyle, trail.length]);

  const showEffect =
    !reducedMotion && (cursorStyle === "glow" || cursorStyle === "trail") && isHovering;

  const cursorMarkup =
    showEffect && cursorStyle === "glow" ? (
      <div
        ref={glowRef}
        className="fixed left-0 top-0 pointer-events-none z-[9999] rounded-full will-change-transform"
        style={{
          contain: "layout style paint",
          width: 96,
          height: 96,
          background: `radial-gradient(circle, ${color}35 0%, ${color}15 35%, transparent 65%)`,
          transform: `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0) translate(-50%, -50%)`,
        }}
      />
    ) : showEffect && cursorStyle === "trail" ? (
      <>
        {trail.map((t) => (
          <div
            key={t.id}
            className="fixed left-0 top-0 pointer-events-none z-[9998] rounded-full will-change-transform"
            style={{
              transform: `translate3d(${t.x}px, ${t.y}px, 0) translate(-50%, -50%)`,
              width: 40,
              height: 40,
              background: `radial-gradient(circle, ${color}40 0%, ${color}15 50%, transparent 70%)`,
              opacity: 0.7,
            }}
          />
        ))}
        <div
          ref={trailDotRef}
          className="fixed left-0 top-0 pointer-events-none z-[9999] rounded-full will-change-transform"
          style={{
            contain: "layout style paint",
            width: 10,
            height: 10,
            background: color,
            boxShadow: `0 0 16px ${color}90, 0 0 32px ${color}50`,
            transform: `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0) translate(-50%, -50%)`,
          }}
        />
      </>
    ) : null;

  return (
    <div onMouseEnter={handleMouseEnter} className="relative">
      {children}
      {typeof document !== "undefined" && document.body && createPortal(cursorMarkup, document.body)}
    </div>
  );
}
