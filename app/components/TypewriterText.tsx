"use client";

import { useState, useEffect, useRef } from "react";

const FIELD_ANIMATIONS = ["none", "typewriter", "fade-in", "slide-up", "slide-in-left", "blur-in"] as const;
export type FieldAnimation = (typeof FIELD_ANIMATIONS)[number];

interface TypewriterTextProps {
  text: string;
  speedMs?: number;
  showCursor?: boolean;
  className?: string;
  onComplete?: () => void;
}

/** Types out text character by character with optional blinking cursor. */
export default function TypewriterText({
  text,
  speedMs = 40,
  showCursor = true,
  className = "",
  onComplete,
}: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!text) {
      setDisplayed("");
      setDone(true);
      onCompleteRef.current?.();
      return;
    }
    setDisplayed("");
    setDone(false);
    let index = 0;
    const timer = setInterval(() => {
      index += 1;
      setDisplayed(text.slice(0, index));
      if (index >= text.length) {
        clearInterval(timer);
        setDone(true);
        onCompleteRef.current?.();
      }
    }, speedMs);
    return () => clearInterval(timer);
  }, [text, speedMs]);

  return (
    <span className={className}>
      {displayed}
      {showCursor && !done && (
        <span
          className="inline-block w-0.5 h-[1em] align-baseline ml-0.5 bg-[var(--terminal)] cursor-blink"
          aria-hidden
        />
      )}
    </span>
  );
}

interface AnimatedFieldProps {
  animation?: string | null;
  children: React.ReactNode;
  className?: string;
  as?: "span" | "div";
}

/** Wraps content with entrance animation. For typewriter, use TypewriterText for the text content. */
export function AnimatedField({ animation, children, className = "", as: Tag = "span" }: AnimatedFieldProps) {
  const anim = animation && FIELD_ANIMATIONS.includes(animation as FieldAnimation) ? animation : "none";
  if (anim === "none") {
    return <Tag className={className}>{children}</Tag>;
  }
  const animClass =
    anim === "typewriter"
      ? "" // typewriter is handled by TypewriterText
      : anim === "fade-in"
        ? "profile-field-fade-in"
        : anim === "slide-up"
          ? "profile-field-slide-up"
          : anim === "slide-in-left"
            ? "profile-field-slide-in-left"
            : anim === "blur-in"
              ? "profile-field-blur-in"
              : "";
  return (
    <Tag className={`${animClass} ${className}`.trim()}>
      {children}
    </Tag>
  );
}
