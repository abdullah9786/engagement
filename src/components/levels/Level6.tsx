"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import confetti from "canvas-confetti";

const REVEAL_DELAYS = [0, 400, 750, 1150, 1600, 2050, 2450, 2850];
const TOTAL_STEPS = REVEAL_DELAYS.length;

export default function Level6() {
  const [phase, setPhase] = useState<"dark" | "reveal" | "live">("dark");
  const [step, setStep] = useState(0);
  const firedRef = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const shimmerRef = useRef<HTMLDivElement>(null);

  /* ── 3D tilt via spring-smoothed motion values ───── */
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 120, damping: 20 });
  const smy = useSpring(my, { stiffness: 120, damping: 20 });
  const rotateX = useTransform(smy, [-0.5, 0.5], [5, -5]);
  const rotateY = useTransform(smx, [-0.5, 0.5], [-5, 5]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const rect = cardRef.current?.getBoundingClientRect();
      if (!rect) return;
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      mx.set(px - 0.5);
      my.set(py - 0.5);
      if (shimmerRef.current) {
        shimmerRef.current.style.background = `radial-gradient(ellipse at ${px * 100}% ${py * 100}%, rgba(255,245,190,0.055) 0%, transparent 55%)`;
      }
    },
    [mx, my],
  );

  const onPointerLeave = useCallback(() => {
    mx.set(0);
    my.set(0);
    if (shimmerRef.current) {
      shimmerRef.current.style.background =
        "radial-gradient(ellipse at 50% 50%, rgba(255,245,190,0.02) 0%, transparent 55%)";
    }
  }, [mx, my]);

  /* ── phase orchestration ─────────────────────────── */
  useEffect(() => {
    const t = setTimeout(() => setPhase("reveal"), 1100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== "reveal") return;
    const timers = REVEAL_DELAYS.map((d, i) =>
      setTimeout(() => setStep(i + 1), d),
    );
    timers.push(
      setTimeout(
        () => setPhase("live"),
        REVEAL_DELAYS[TOTAL_STEPS - 1] + 700,
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  /* ── celebratory confetti ────────────────────────── */
  useEffect(() => {
    if (phase !== "live" || firedRef.current) return;
    firedRef.current = true;
    const end = Date.now() + 3200;
    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 50,
        origin: { x: 0, y: 0.55 },
        colors: ["#d4af37", "#f5e6cc", "#f59e0b", "#fbbf24"],
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 50,
        origin: { x: 1, y: 0.55 },
        colors: ["#d4af37", "#f5e6cc", "#f59e0b", "#fbbf24"],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [phase]);

  const celebrate = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 100,
      origin: { y: 0.55 },
      colors: ["#d4af37", "#f5e6cc", "#f59e0b", "#ec4899", "#a78bfa"],
    });
  }, []);

  const sr = (seed: number, i: number) => {
    const v = Math.sin(seed * 127.1 + i * 311.7) * 43758.5453;
    return v - Math.floor(v);
  };

  const show = phase === "reveal" || phase === "live";

  return (
    <motion.div
      className="relative flex h-full w-full items-center justify-center overflow-hidden px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      onClick={phase === "live" ? celebrate : undefined}
    >
      {/* background radial glow */}
      <div
        className="pointer-events-none absolute z-0"
        style={{ top: "46%", left: "50%", translate: "-50% -50%" }}
      >
        <motion.div
          className="rounded-full"
          style={{
            width: 700,
            height: 700,
            background:
              "radial-gradient(circle, rgba(212,175,55,0.12) 0%, rgba(170,120,35,0.04) 45%, transparent 65%)",
            filter: "blur(40px)",
          }}
          animate={
            phase === "live"
              ? { scale: [1, 1.04, 1], opacity: [0.65, 1, 0.65] }
              : {}
          }
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut" as const,
          }}
        />
      </div>

      {/* gathering light orb before card appears */}
      <AnimatePresence>
        {phase === "dark" && (
          <motion.div
            className="absolute z-10 h-3 w-3 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(255,240,180,0.85) 0%, rgba(212,175,55,0.25) 55%, transparent 80%)",
              boxShadow:
                "0 0 40px rgba(212,175,55,0.3), 0 0 80px rgba(212,175,55,0.08)",
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 1], scale: [0, 1, 2] }}
            exit={{ opacity: 0, scale: 15 }}
            transition={{ duration: 1.1, times: [0, 0.35, 1] }}
          />
        )}
      </AnimatePresence>

      {/* ── THE INVITATION CARD ────────────────────── */}
      <AnimatePresence>
        {show && (
          <motion.div
            className="relative z-10 w-full max-w-[370px] sm:max-w-[410px]"
            style={{ perspective: 1200 }}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            initial={{ opacity: 0, scale: 0.7, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              ref={cardRef}
              className="relative overflow-hidden rounded-2xl border border-amber-400/[0.18]"
              style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
                background:
                  "linear-gradient(168deg, rgba(35,30,22,0.97) 0%, rgba(18,16,12,0.98) 100%)",
                boxShadow:
                  "0 0 100px rgba(212,175,55,0.1), 0 30px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(212,175,55,0.15), inset 0 -1px 0 rgba(212,175,55,0.04)",
              }}
            >
              {/* foil shimmer layer — updated via ref for perf */}
              <div
                ref={shimmerRef}
                className="pointer-events-none absolute inset-0 z-20 rounded-2xl"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 50%, rgba(255,245,190,0.06) 0%, transparent 55%)",
                  transition: "background 0.08s linear",
                }}
              />

              <div className="relative px-7 py-9 sm:px-10 sm:py-11">
                {/* ornate corner accents */}
                <Corner pos="top-left" />
                <Corner pos="top-right" />
                <Corner pos="bottom-left" />
                <Corner pos="bottom-right" />

                {/* inner decorative border */}
                <div className="pointer-events-none absolute inset-[14px] z-0 rounded-lg border border-amber-400/[0.12] sm:inset-[18px]" />

                {/* ── card content ──────────────────── */}
                <div className="relative z-10 flex flex-col items-center gap-[1.15rem] text-center sm:gap-5">
                  {/* monogram */}
                  <Reveal visible={step >= 1}>
                    <div className="flex items-baseline gap-3 font-serif text-[1.6rem] tracking-[0.22em] text-amber-300/75 sm:text-[1.9rem]">
                      <span className="font-light">R</span>
                      <motion.span
                        className="text-sm text-amber-200/70 sm:text-base"
                        animate={{
                          scale: [1, 1.15, 1],
                          opacity: [0.7, 1, 0.7],
                        }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          ease: "easeInOut" as const,
                        }}
                      >
                        &amp;
                      </motion.span>
                      <span className="font-light">S</span>
                    </div>
                  </Reveal>

                  {/* ornamental divider */}
                  <Reveal visible={step >= 2} scaleX>
                    <div className="flex items-center gap-3">
                      <div className="h-px w-9 bg-gradient-to-r from-transparent to-amber-400/40 sm:w-12" />
                      <OrnamentDot />
                      <motion.svg
                        className="h-[0.7rem] w-[0.7rem] text-amber-300/70 sm:h-3 sm:w-3"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        animate={
                          phase === "live"
                            ? {
                                scale: [1, 1.2, 1],
                                opacity: [0.7, 1, 0.7],
                              }
                            : {}
                        }
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut" as const,
                        }}
                      >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </motion.svg>
                      <OrnamentDot />
                      <div className="h-px w-9 bg-gradient-to-l from-transparent to-amber-400/40 sm:w-12" />
                    </div>
                  </Reveal>

                  {/* "Together with their families" */}
                  <Reveal visible={step >= 2} delay={0.1}>
                    <p className="font-serif text-[0.7rem] tracking-[0.22em] text-amber-200/70 italic sm:text-xs">
                      Together with their families
                    </p>
                  </Reveal>

                  {/* names — the hero */}
                  <Reveal visible={step >= 3}>
                    <h1 className="font-serif text-[1.55rem] leading-snug font-light tracking-wide text-amber-50 sm:text-[1.85rem] md:text-[2rem]" style={{ textShadow: "0 0 30px rgba(212,175,55,0.15)" }}>
                      Rumaesa{" "}
                      <span className="text-amber-400/65">&amp;</span>{" "}
                      Sharik
                    </h1>
                  </Reveal>

                  {/* "request the pleasure…" */}
                  <Reveal visible={step >= 4}>
                    <p className="font-serif text-[0.7rem] tracking-[0.22em] text-amber-200/70 italic sm:text-xs">
                      request the pleasure of your company
                    </p>
                  </Reveal>

                  {/* mid divider */}
                  <Reveal visible={step >= 4} delay={0.12} scaleX>
                    <div className="flex items-center gap-2">
                      <div className="h-px w-6 bg-gradient-to-r from-transparent to-amber-400/30 sm:w-10" />
                      <OrnamentDot />
                      <div className="h-px w-6 bg-gradient-to-l from-transparent to-amber-400/30 sm:w-10" />
                    </div>
                  </Reveal>

                  {/* date & time */}
                  <Reveal visible={step >= 5}>
                    <div className="flex flex-col items-center gap-1">
                      <p className="font-serif text-[0.9rem] tracking-[0.14em] text-amber-200/90 sm:text-base">
                        Saturday, 11th April
                      </p>
                      <p className="text-xl font-light tracking-widest text-amber-50 sm:text-2xl" style={{ textShadow: "0 0 20px rgba(212,175,55,0.12)" }}>
                        2026
                      </p>
                      <p className="text-[0.55rem] tracking-[0.3em] text-amber-200/60 uppercase sm:text-[0.65rem]">
                        7  O'Clock in the evening
                      </p>
                    </div>
                  </Reveal>

                  {/* venue */}
                  <Reveal visible={step >= 6}>
                    <div className="flex flex-col items-center gap-0.5">
                      <p className="font-serif text-[0.85rem] text-amber-200/80 italic sm:text-base">
                      Saif Hall
                      </p>
                      <p className="text-[0.55rem] tracking-wider text-amber-100/50 sm:text-[0.65rem]">
                      Boman Behram Marg, Next To Maharashtra College, Nagpada, Mumbai  
                      </p>
                    </div>
                  </Reveal>

                  {/* bottom divider */}
                  <Reveal visible={step >= 7} scaleX>
                    <div className="h-px w-12 bg-gradient-to-r from-transparent via-amber-400/25 to-transparent sm:w-16" />
                  </Reveal>

                  {/* actions */}
                  <Reveal visible={step >= 8}>
                    <div className="flex gap-3.5 pt-0.5 sm:gap-4">
         
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          celebrate();
                        }}
                        className="rounded-xl border border-amber-400/25 bg-amber-500/[0.04] px-6 py-2.5 text-[0.72rem] font-medium tracking-wider text-amber-200/75 transition-colors hover:bg-amber-500/[0.08] sm:px-8 sm:text-sm"
                      >
                        Celebrate!
                      </motion.button>
                    </div>
                  </Reveal>
                </div>

                {/* golden scanning line during content reveal */}
                {phase === "reveal" && (
                  <motion.div
                    className="pointer-events-none absolute right-5 left-5 z-30 h-px sm:right-7 sm:left-7"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.3) 20%, rgba(255,245,190,0.5) 50%, rgba(212,175,55,0.3) 80%, transparent 100%)",
                      boxShadow:
                        "0 0 10px rgba(212,175,55,0.15), 0 0 25px rgba(212,175,55,0.05)",
                    }}
                    initial={{ top: "4%" }}
                    animate={{ top: "96%" }}
                    transition={{
                      duration:
                        (REVEAL_DELAYS[TOTAL_STEPS - 1] + 200) / 1000,
                      ease: "easeInOut" as const,
                    }}
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* "tap anywhere" whisper */}
      <AnimatePresence>
        {phase === "live" && (
          <motion.p
            className="absolute bottom-[4%] z-10 text-[0.5rem] tracking-[0.35em] text-amber-300/10 uppercase sm:text-[0.55rem]"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.06, 0.2, 0.06] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut" as const,
              delay: 0.8,
            }}
          >
            tap anywhere to celebrate
          </motion.p>
        )}
      </AnimatePresence>

      {/* floating hearts */}
      {phase === "live" &&
        Array.from({ length: 7 }).map((_, i) => (
          <motion.div
            key={i}
            className="pointer-events-none absolute text-amber-400/[0.06]"
            style={{ left: `${10 + sr(1, i) * 80}%`, bottom: -20 }}
            animate={{
              y: -(
                typeof window !== "undefined"
                  ? window.innerHeight + 50
                  : 850
              ),
              opacity: [0, 0.22, 0],
              rotate: sr(2, i) * 40 - 20,
              scale: 0.3 + sr(3, i) * 0.45,
            }}
            transition={{
              duration: 8 + sr(4, i) * 5,
              delay: i * 0.9,
              repeat: Infinity,
              ease: "easeOut" as const,
            }}
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </motion.div>
        ))}
    </motion.div>
  );
}

/* ── helper components ─────────────────────────────── */

function Reveal({
  visible,
  delay = 0,
  scaleX = false,
  children,
}: {
  visible: boolean;
  delay?: number;
  scaleX?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={
        scaleX ? { opacity: 0, scaleX: 0 } : { opacity: 0, y: 10 }
      }
      animate={
        visible
          ? scaleX
            ? { opacity: 1, scaleX: 1 }
            : { opacity: 1, y: 0 }
          : {}
      }
      transition={{ duration: 0.55, delay, ease: "easeOut" as const }}
    >
      {children}
    </motion.div>
  );
}

function Corner({
  pos,
}: {
  pos: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}) {
  const isTop = pos.startsWith("top");
  const isLeft = pos.endsWith("left");

  return (
    <svg
      className={`absolute z-10 h-5 w-5 text-amber-400/[0.22] sm:h-6 sm:w-6 ${isTop ? "top-[10px]" : "bottom-[10px]"} ${isLeft ? "left-[10px]" : "right-[10px]"}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.75"
      style={{
        transform: `scale(${isLeft ? 1 : -1}, ${isTop ? 1 : -1})`,
      }}
    >
      <path d="M2 14 L2 2 L14 2" />
      <path d="M5.5 9 L5.5 5.5 L9 5.5" />
    </svg>
  );
}

function OrnamentDot() {
  return (
    <div className="h-[3px] w-[3px] rounded-full bg-amber-400/30 sm:h-1 sm:w-1" />
  );
}
