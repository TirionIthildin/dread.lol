"use client";

import { type ReactNode, useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Logo from "@/app/components/Logo";

interface TerminalWindowProps {
  title: string;
  children: ReactNode;
  className?: string;
  onClose?: () => void;
}

type DragPosition = { x: number; y: number; width: number; height: number };

export default function TerminalWindow({ title, children, className = "", onClose }: TerminalWindowProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState<DragPosition | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    width: number;
    height: number;
    committed: boolean;
  } | null>(null);

  const DRAG_THRESHOLD_PX = 4;
  const TITLE_BAR_HEIGHT_PX = 44;

  const handleClose = useCallback(() => {
    if (!onClose) return;
    setIsClosing(true);
    closeTimeoutRef.current = setTimeout(onClose, 220);
  }, [onClose]);

  const handleMinimize = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMinimized(true);
  }, []);

  const handleExpand = useCallback(() => {
    setIsMinimized(false);
  }, []);

  const handleTitleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest("button")) return;
      if (isMinimized) return;
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      const el = windowRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      dragStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialX: rect.left,
        initialY: rect.top,
        width: rect.width,
        height: rect.height,
        committed: false,
      };
      setIsDragging(true);
    },
    [isMinimized]
  );

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      const start = dragStartRef.current;
      if (!start) return;
      const dx = e.clientX - start.startX;
      const dy = e.clientY - start.startY;
      if (!start.committed) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < DRAG_THRESHOLD_PX) return;
        dragStartRef.current = { ...start, committed: true };
      }
      setPosition({
        x: start.initialX + dx,
        y: start.initialY + dy,
        width: start.width,
        height: start.height,
      });
    };
    const onUp = () => {
      if (!dragStartRef.current?.committed) {
        setPosition(null);
      }
      setIsDragging(false);
      dragStartRef.current = null;
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [isDragging]);

  useEffect(() => {
    if (isDragging && typeof document !== "undefined") {
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const isFloating = position !== null;

  const floatingStyle =
    isFloating && position
      ? {
          position: "fixed" as const,
          left: position.x,
          top: position.y,
          width: position.width,
          minHeight: isMinimized ? TITLE_BAR_HEIGHT_PX : position.height,
          height: isMinimized ? TITLE_BAR_HEIGHT_PX : position.height,
          maxHeight: isMinimized ? TITLE_BAR_HEIGHT_PX : position.height,
          zIndex: 9998,
          margin: 0,
          transition: isMinimized ? "height 0.2s ease-out" : "none",
          transform: "none",
        }
      : undefined;

  const terminalChrome = (
    <div
      className={`overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]/95 shadow-2xl shadow-black/50 backdrop-blur-sm ${className} ${
        isClosing ? "opacity-0 scale-95 pointer-events-none" : ""
      } ${isFloating || isDragging ? "duration-0" : "transition-all duration-200"}`}
      style={floatingStyle}
      role="article"
      aria-hidden={isClosing}
    >
      <div
        className={`flex items-center gap-2 border-b border-[var(--border)] bg-[var(--bg)]/80 px-3 py-2 sm:px-4 transition-colors select-none ${
          isMinimized ? "cursor-pointer hover:bg-[var(--border)]/30" : "cursor-grab active:cursor-grabbing"
        } ${isDragging ? "cursor-grabbing" : ""}`}
        onClick={isMinimized ? handleExpand : undefined}
        onMouseDown={isMinimized ? undefined : handleTitleMouseDown}
        role={isMinimized ? "button" : undefined}
        tabIndex={isMinimized ? 0 : undefined}
        onKeyDown={
          isMinimized
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleExpand();
                }
              }
            : undefined
        }
        aria-label={isMinimized ? "Expand window" : "Drag to move window"}
      >
        <span className="shrink-0 flex items-center" aria-hidden>
          <Logo size={20} className="w-5 h-5 opacity-90" />
        </span>
        <div className="flex gap-1.5 items-center shrink-0 ml-2" aria-hidden>
          {onClose ? (
            <button
              type="button"
              onClick={handleClose}
              className="h-2 w-2 min-w-[8px] min-h-[8px] rounded-full bg-[#ef4444] transition-opacity hover:opacity-80 focus:opacity-80 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1 focus:ring-offset-[var(--surface)] cursor-pointer"
              aria-label="Close window"
            />
          ) : (
            <span className="h-2 w-2 rounded-full bg-[#ef4444]" aria-hidden />
          )}
          <button
            type="button"
            onClick={handleMinimize}
            className="h-2 w-2 min-w-[8px] min-h-[8px] rounded-full bg-[#eab308] transition-opacity hover:opacity-80 focus:opacity-80 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1 focus:ring-offset-[var(--surface)] cursor-pointer"
            aria-label="Minimize window"
          />
          <span className="h-2 w-2 rounded-full bg-[#22c55e]" aria-hidden />
        </div>
        <span className="ml-2 font-mono text-xs text-[var(--muted)] truncate flex-1 min-w-0">
          {title}
        </span>
        {isMinimized && (
          <span className="shrink-0 text-[10px] text-[var(--muted)] uppercase tracking-wider">
            Click to expand
          </span>
        )}
      </div>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          isMinimized ? "grid-rows-[0fr]" : "grid-rows-[1fr]"
        }`}
        aria-hidden={isMinimized}
      >
        <div className="min-h-0 overflow-hidden border-t border-[var(--border)]/50">
          <div className="p-4 font-mono text-sm sm:p-5 sm:text-sm">{children}</div>
        </div>
      </div>
    </div>
  );

  const windowContent = (
    <div ref={windowRef} style={floatingStyle}>
      {terminalChrome}
    </div>
  );

  if (isFloating && typeof document !== "undefined") {
    return createPortal(windowContent, document.body);
  }

  return windowContent;
}
