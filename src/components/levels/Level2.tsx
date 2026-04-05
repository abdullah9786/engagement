"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useGame } from "@/context/GameContext";
import type { PageFlip } from "page-flip";

const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. In cursus mollis nibh, non convallis ex convallis eu. Suspendisse potenti. Aenean vitae pellentesque erat. Integer non tristique quam. Suspendisse rutrum, augue ac sollicitudin mollis, eros velit viverra metus, a venenatis tellus tellus id magna.";

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
              {/* cover */}
              <div
                className="page page-cover page-cover-top"
                data-density="hard"
              >
                <div className="page-content">
                  <h2>BOOK TITLE</h2>
                </div>
              </div>

              <div className="page">
                <div className="page-content">
                  <h2 className="page-header">Page header - 1</h2>
                  <div className="page-text">{LOREM}</div>
                  <div className="page-footer">1</div>
                </div>
              </div>

              <div className="page">
                <div className="page-content">
                  <h2 className="page-header">Page header - 2</h2>
                  <div className="page-text">{LOREM}</div>
                  <div className="page-footer">2</div>
                </div>
              </div>

              <div className="page">
                <div className="page-content">
                  <h2 className="page-header">Page header - 3</h2>
                  <div className="page-text">{LOREM}</div>
                  <div className="page-footer">3</div>
                </div>
              </div>

              <div className="page">
                <div className="page-content">
                  <h2 className="page-header">Page header - 4</h2>
                  <div className="page-text">{LOREM}</div>
                  <div className="page-footer">4</div>
                </div>
              </div>

              <div className="page">
                <div className="page-content">
                  <h2 className="page-header">Page header - 5</h2>
                  <div className="page-text">{LOREM}</div>
                  <div className="page-footer">5</div>
                </div>
              </div>

              <div className="page">
                <div className="page-content">
                  <h2 className="page-header">Page header - 6</h2>
                  <div className="page-text">{LOREM}</div>
                  <div className="page-footer">6</div>
                </div>
              </div>

              {/* back cover */}
              <div
                className="page page-cover page-cover-bottom"
                data-density="hard"
              >
                <div className="page-content">
                  <h2>THE END</h2>
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
