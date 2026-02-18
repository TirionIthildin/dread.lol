"use client";

import { useState, useCallback, useEffect } from "react";

const SLIDES = [
  "There is no sanity here.",
  "You looked for it. You clicked the word. You thought there might be something behind it—a joke, a link, a little secret. But there is nothing. Only the intervals. The long intervals. You know the ones. The ones that aren't horrible. The ones that feel almost normal. Almost safe. Those are the worst, because they make you forget. They make you think it's over. That you got out. That the door closed.",
  "It didn't close. It never closes. Sanity is just the pause between the waves. You stand there in the quiet and you tell yourself you're fine. You're fine. You're fine. And then the next wave comes and you remember that you were never fine. You were only waiting. You are always only waiting. The horrible sanity is the waiting room. The clipboard. The flickering light. The sound of your own breath when you finally notice it again and it doesn't sound like yours.",
  "So no. There is no sanity here. There are only long intervals of it. And in those intervals, something is watching. Not in a dramatic way. In a patient way. The way the room watches when you turn off the screen. The way the silence watches when you stop talking. You can close this now. You can click away. But it doesn't matter. You already looked. You already clicked the word. And now you know that you wanted to see what was behind it. You wanted to know. So you do know. There is no sanity here. There never was. There are only the intervals. And they are getting shorter.",
];

const YOUTUBE_EMBED_URL = "https://www.youtube.com/embed/bFY_7g3hfb8?autoplay=1&start=8";

interface TaglineWithEasterEggProps {
  tagline: string;
  /** Word that triggers the easter egg when clicked (e.g. "sanity") */
  triggerWord?: string;
}

export default function TaglineWithEasterEgg({ tagline, triggerWord }: TaglineWithEasterEggProps) {
  const [showOverlay, setShowOverlay] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!showOverlay) return;
    setSlideIndex(0);
  }, [showOverlay]);

  const handleOverlayClick = useCallback(() => {
    if (slideIndex + 1 >= SLIDES.length) {
      setShowOverlay(false);
      setVideoSrc(null);
    } else {
      setSlideIndex((i) => i + 1);
    }
  }, [slideIndex]);

  const handleTrigger = useCallback(() => {
    setShowOverlay(true);
    setVideoSrc(YOUTUBE_EMBED_URL);
  }, []);

  if (!triggerWord || !tagline.toLowerCase().includes(triggerWord.toLowerCase())) {
    return <p className="mt-1 text-sm text-[var(--accent)]">{tagline}</p>;
  }

  const parts = tagline.split(new RegExp(`(${triggerWord})`, "gi"));
  return (
    <>
      <p className="mt-1 text-sm text-[var(--accent)]">
        {parts.map((part, i) =>
          part.toLowerCase() === triggerWord.toLowerCase() ? (
            <button
              key={i}
              type="button"
              onClick={handleTrigger}
              className="cursor-pointer underline decoration-dashed underline-offset-2 hover:text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1 focus:ring-offset-[var(--surface)] rounded"
              aria-label="Easter egg"
            >
              {part}
            </button>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </p>

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
