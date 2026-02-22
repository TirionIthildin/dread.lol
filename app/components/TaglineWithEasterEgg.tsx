"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import DonutAnimation from "@/app/components/DonutAnimation";
import TypewriterText, { AnimatedField } from "@/app/components/TypewriterText";

const SLIDES = [
  "There is no sanity here.",
  "You looked for it. You clicked the word. You thought there might be something behind it—a joke, a link, a little secret. But there is nothing. Only the intervals. The long intervals. You know the ones. The ones that aren't horrible. The ones that feel almost normal. Almost safe. Those are the worst, because they make you forget. They make you think it's over. That you got out. That the door closed.",
  "It didn't close. It never closes. Sanity is just the pause between the waves. You stand there in the quiet and you tell yourself you're fine. You're fine. You're fine. And then the next wave comes and you remember that you were never fine. You were only waiting. You are always only waiting. The horrible sanity is the waiting room. The clipboard. The flickering light. The sound of your own breath when you finally notice it again and it doesn't sound like yours.",
  "So no. There is no sanity here. There are only long intervals of it. And in those intervals, something is watching. Not in a dramatic way. In a patient way. The way the room watches when you turn off the screen. The way the silence watches when you stop talking. You can close this now. You can click away. But it doesn't matter. You already looked. You already clicked the word. And now you know that you wanted to see what was behind it. You wanted to know. So you do know. There is no sanity here. There never was. There are only the intervals. And they are getting shorter.",
];

const YOUTUBE_EMBED_URL = "https://www.youtube.com/embed/bFY_7g3hfb8?autoplay=1&start=8";
const DONUT_ARTICLE_URL = "https://www.a1k0n.net/2011/07/20/donut-math.html";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Build regex that matches built-in words plus optional profile trigger words (case-insensitive). */
function buildTriggerRegex(
  easterEggTaglineWord?: string,
  easterEggLinkTrigger?: string
): RegExp {
  const parts: string[] = ["ithildin", "insanity"];
  if (easterEggTaglineWord?.trim()) parts.push(escapeRegex(easterEggTaglineWord.trim()));
  if (easterEggLinkTrigger?.trim()) {
    const escaped = escapeRegex(easterEggLinkTrigger.trim());
    if (!parts.includes(escaped)) parts.push(escaped);
  }
  return new RegExp(`(${parts.join("|")})`, "gi");
}

type TriggerKind = "overlay" | "donut" | "link";

function getTriggerKind(
  part: string,
  easterEggTaglineWord?: string,
  easterEggLink?: { triggerWord: string; url: string; popupUrl?: string }
): TriggerKind | null {
  const lower = part.toLowerCase();
  if (easterEggTaglineWord && lower === easterEggTaglineWord.trim().toLowerCase()) return "overlay";
  if (easterEggLink && lower === easterEggLink.triggerWord.trim().toLowerCase()) {
    return easterEggLink.popupUrl ? "donut" : "link";
  }
  if (lower === "insanity") return "overlay";
  if (lower === "ithildin") return "donut";
  return null;
}

const TAGLINE_ANIMATIONS = ["none", "typewriter", "fade-in", "slide-up", "slide-in-left", "blur-in"] as const;

interface TaglineWithEasterEggProps {
  tagline: string;
  /** Word in tagline that triggers the scary overlay (e.g. "sanity"). */
  easterEggTaglineWord?: string;
  /** Word in tagline that opens a link or donut popup. */
  easterEggLink?: { triggerWord: string; url: string; popupUrl?: string };
  /** Per-field animation: none, typewriter, fade-in, slide-up, etc. */
  animation?: string | null;
}

export default function TaglineWithEasterEgg({
  tagline,
  easterEggTaglineWord,
  easterEggLink,
  animation,
}: TaglineWithEasterEggProps) {
  const [showOverlay, setShowOverlay] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showOverlay) return;
    setSlideIndex(0);
  }, [showOverlay]);

  useEffect(() => {
    if (!showPopup) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowPopup(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showPopup]);

  const handleOverlayClick = useCallback(() => {
    if (slideIndex + 1 >= SLIDES.length) {
      setShowOverlay(false);
      setVideoSrc(null);
    } else {
      setSlideIndex((i) => i + 1);
    }
  }, [slideIndex]);

  const handleDonutClick = useCallback(() => {
    setShowPopup(true);
  }, []);

  const handleOverlayWordClick = useCallback(() => {
    setShowOverlay(true);
    setVideoSrc(YOUTUBE_EMBED_URL);
  }, []);

  const handleLinkClick = useCallback((url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const taglineAnim = animation && TAGLINE_ANIMATIONS.includes(animation as (typeof TAGLINE_ANIMATIONS)[number]) ? animation : "none";
  const triggerRegex = buildTriggerRegex(easterEggTaglineWord, easterEggLink?.triggerWord);
  const parts = tagline.split(triggerRegex);

  if (parts.length <= 1) {
    return (
      <p className="mt-1.5 text-sm text-[var(--accent)]/90 tracking-wide">
        {taglineAnim === "typewriter" ? (
          <TypewriterText text={tagline} speedMs={35} showCursor={true} />
        ) : taglineAnim !== "none" ? (
          <AnimatedField animation={taglineAnim}>{tagline}</AnimatedField>
        ) : (
          tagline
        )}
      </p>
    );
  }

  const buttonClass =
    "cursor-pointer underline decoration-dashed decoration-[var(--accent)]/60 underline-offset-3 hover:text-[var(--foreground)] hover:decoration-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1 focus:ring-offset-[var(--surface)] rounded transition-colors";

  const taglineP = (
    <p className="mt-1.5 text-sm text-[var(--accent)]/90 tracking-wide">
        {parts.map((part, i) => {
          const kind = getTriggerKind(part, easterEggTaglineWord, easterEggLink);
          if (kind === "overlay") {
            return (
              <button
                key={i}
                type="button"
                onClick={handleOverlayWordClick}
                className={buttonClass}
                aria-label="Easter egg"
              >
                {part}
              </button>
            );
          }
          if (kind === "donut") {
            return (
              <button
                key={i}
                type="button"
                onClick={handleDonutClick}
                className={buttonClass}
                aria-label="Easter egg"
              >
                {part}
              </button>
            );
          }
          if (kind === "link" && easterEggLink?.url) {
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleLinkClick(easterEggLink.url)}
                className={buttonClass}
                aria-label="Open link"
              >
                {part}
              </button>
            );
          }
          return <span key={i}>{part}</span>;
        })}
    </p>
  );

  return (
    <>
      {taglineAnim !== "none" && taglineAnim !== "typewriter" ? (
        <AnimatedField animation={taglineAnim} as="div">
          {taglineP}
        </AnimatedField>
      ) : (
        taglineP
      )}

      {showPopup && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-[var(--bg)]/98 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Spinning donut"
        >
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" aria-hidden style={{ backgroundImage: "linear-gradient(rgba(6, 182, 212, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.2) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
          <div className="relative flex items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--surface)]/90 px-3 py-2.5 sm:px-4 shrink-0 shadow-lg shadow-black/20">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--accent)]" aria-hidden />
              <span className="font-mono text-xs text-[var(--muted)] truncate">
                donut.c
              </span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={DONUT_ARTICLE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--accent)] hover:text-[var(--terminal)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] rounded px-2 py-1"
              >
                a1k0n.net
              </a>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setShowPopup(false)}
                className="rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-xs text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                aria-label="Close popup (Escape)"
              >
                Close
              </button>
            </div>
          </div>
          <div className="relative flex-1 flex flex-col min-h-0 p-6 overflow-hidden">
            <div className="flex-1 min-h-0 w-full flex items-center justify-center">
              <DonutAnimation />
            </div>
          </div>
        </div>
      )}

      {showOverlay && (
        <>
          {videoSrc && (
            <iframe
            src={videoSrc}
            title="Easter egg audio"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="fixed -left-[9999px] top-0 w-[100px] h-[100px] opacity-0 pointer-events-none overflow-hidden"
            aria-hidden
          />
          )}
          <button
            type="button"
            onClick={handleOverlayClick}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/98 cursor-pointer focus:outline-none py-12 px-6"
            aria-label={slideIndex + 1 >= SLIDES.length ? "Close overlay" : "Next slide"}
          >
            <div
              key={slideIndex}
              className="font-mono text-sm sm:text-base text-red-900/90 animate-glitch select-none max-w-xl text-left animate-fade-in"
              style={{
                textShadow: "0 0 20px rgba(127,0,0,0.5), 0 0 40px rgba(127,0,0,0.3)",
              }}
            >
              <p className="whitespace-pre-wrap">{SLIDES[slideIndex]}</p>
            </div>
            <p className="mt-8 text-[var(--muted)] text-xs font-mono">
              {slideIndex + 1} / {SLIDES.length} — click to continue
            </p>
          </button>
        </>
      )}
    </>
  );
}
