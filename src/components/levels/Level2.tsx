"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useGame } from "@/context/GameContext";
import type { PageFlip } from "page-flip";

const PAGES = [
  {
    icon: "🤲",
    title: "A Prayer Answered",
    text: "It began the way all beautiful things do — with a quiet prayer and trust in what was meant to be.",
  },
  {
    icon: "💌",
    title: "The Rishta",
    text: "A name was spoken, a family reached out, and two households began a conversation that would change everything.",
  },
  {
    icon: "📸",
    title: "The First Photo",
    text: "A single photograph was shared — and somehow, without a word exchanged, it felt like the beginning of something right.",
  },
  {
    icon: "👨‍👩‍👧‍👦",
    title: "Families United",
    text: "Two families met, shared chai and laughter, and discovered that some bonds are simply written in fate.",
  },
  {
    icon: "✨",
    title: "The \u2018Yes\u2019",
    text: "With blessings from both sides, the answer came — not as a surprise, but as a quiet confirmation of what everyone already felt.",
  },
  {
    icon: "🤝",
    title: "A New Beginning",
    text: "And so, two families became one story. Not with grand gestures, but with faith, respect, and the promise of a shared journey ahead.",
  },
];

const PAGE_W = 280;
const PAGE_H = 400;
const FLIP_DELAY = 2800;

type ClipStage = "cover" | "open" | "back";

const CLIP: Record<ClipStage, string> = {
  cover: "inset(0 0 0 50%)",
  open: "inset(0)",
  back: "inset(0 50% 0 0)",
};

export default function Level2() {
  const { completeLevel } = useGame();
  const [phase, setPhase] = useState<"intro" | "book" | "complete">("intro");
  const [bookReady, setBookReady] = useState(false);
  const [shift, setShift] = useState(-(PAGE_W / 2));
  const [clip, setClip] = useState<ClipStage>("cover");
  const [isPortrait, setIsPortrait] = useState(false);
  const bookRef = useRef<HTMLDivElement>(null);
  const pfRef = useRef<PageFlip | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const schedule = (fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
  };

  /* intro → book */
  useEffect(() => {
    const t = setTimeout(() => setPhase("book"), 1800);
    return () => clearTimeout(t);
  }, []);

  /* complete → advance to next level */
  useEffect(() => {
    if (phase !== "complete") return;
    const t = setTimeout(() => completeLevel(2), 1500);
    return () => clearTimeout(t);
  }, [phase, completeLevel]);

  /* initialise page-flip + auto-flip sequence */
  useEffect(() => {
    if (phase !== "book" || !bookRef.current) return;

    let cancelled = false;
    const mobile = window.innerWidth < 600;

    import("page-flip").then(({ PageFlip }) => {
      if (cancelled || !bookRef.current) return;

      const pf = new PageFlip(bookRef.current, {
        width: PAGE_W,
        height: PAGE_H,
        size: "stretch",
        minWidth: 160,
        maxWidth: PAGE_W,
        minHeight: 240,
        maxHeight: PAGE_H,
        autoSize: false,
        maxShadowOpacity: 0.5,
        showCover: true,
        mobileScrollSupport: false,
        useMouseEvents: false,
        usePortrait: true,
      });

      pf.loadFromHTML(bookRef.current.querySelectorAll(".page"));
      pfRef.current = pf;

      const portrait = pf.getOrientation() === "portrait";
      setIsPortrait(portrait);

      if (portrait) {
        setShift(0);
        setClip("open");
      }

      pf.on("changeOrientation", (e) => {
        const p = e.data === "portrait";
        setIsPortrait(p);
        if (p) {
          setShift(0);
          setClip("open");
        }
      });

      setBookReady(true);

      /* on every flip, decide what's next */
      pf.on("flip", (e) => {
        if (cancelled) return;
        const page = e.data as number;
        const total = pf.getPageCount();

        if (page >= total - 2) {
          if (!mobile) setClip("back");
          schedule(() => {
            if (!mobile) setShift(PAGE_W / 2);
            schedule(() => {
              setPhase("complete");
            }, 600);
          }, 800);
        } else {
          schedule(() => {
            if (!cancelled) pf.flipNext();
          }, FLIP_DELAY);
        }
      });

      /* sequence: wait → expand clip → slide right → open cover */
      schedule(() => {
        if (cancelled) return;
        if (!mobile) {
          setClip("open");
          setShift(0);
        }
        schedule(() => {
          if (!cancelled) pf.flipNext();
        }, 900);
      }, 1500);
    });

    return () => {
      cancelled = true;
      timers.current.forEach(clearTimeout);
      timers.current = [];
      try {
        pfRef.current?.destroy();
      } catch {
        /* already gone */
      }
      pfRef.current = null;
    };
  }, [phase, completeLevel]);

  return (
    <motion.div
      className="relative h-full w-full overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* ═══ INTRO ═══ */}
      {phase === "intro" && (
        <motion.div
          className="flex h-full items-center justify-center text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <h2 className="font-serif text-2xl tracking-widest text-violet-200/80 uppercase">
              Chapter II
            </h2>
            <p className="mt-2 text-lg text-violet-100/50">The Book of Fate</p>
          </div>
        </motion.div>
      )}

      {/* ═══ BOOK ═══ */}
      {phase === "book" && (
        <div
          className="flex h-full items-center justify-center p-4 transition-opacity duration-500"
          style={{ opacity: bookReady ? 1 : 0 }}
        >
          <div
            style={{
              transform: isPortrait ? "none" : `translateX(${shift}px)`,
              clipPath: isPortrait ? "none" : CLIP[clip],
              transition:
                "transform 0.8s cubic-bezier(0.25, 0.1, 0.25, 1), clip-path 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)",
            }}
          >
            <div
              ref={bookRef}
              className="flip-book"
              style={{
                width: isPortrait ? "min(85vw, 280px)" : PAGE_W * 2,
                height: isPortrait ? "min(70vh, 420px)" : PAGE_H,
              }}
            >
              {/* front cover */}
              <div
                className="page page-cover page-cover-top"
                data-density="hard"
              >
                <div className="page-content">
                  <h2>The Book of Fate</h2>
                </div>
              </div>

              {/* story pages */}
              {PAGES.map((p, i) => (
                <div className="page" key={i}>
                  <div className="page-content">
                    <h2 className="page-header">{p.title}</h2>
                    <div className="page-text">
                      <div style={{ fontSize: "2em", textAlign: "center", marginBottom: 12 }}>
                        {p.icon}
                      </div>
                      <p>{p.text}</p>
                    </div>
                    <div className="page-footer">
                      {String(i + 1).padStart(2, "0")} / {String(PAGES.length).padStart(2, "0")}
                    </div>
                  </div>
                </div>
              ))}

              {/* back cover */}
              <div
                className="page page-cover page-cover-bottom"
                data-density="hard"
              >
                <div className="page-content">
                  <h2>Written in the Stars</h2>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ COMPLETE ═══ */}
      {phase === "complete" && (
        <motion.div
          className="flex h-full items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <p className="font-serif text-2xl text-amber-200/90">
            Every moment led to this one&hellip;
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
