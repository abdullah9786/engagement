"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/context/GameContext";
import { useSound } from "@/hooks/useSound";

const DRAW_DURATION = 5;

const THREAD_L = "M 30,50 C 120,180 200,320 320,410 S 430,470 500,500";
const THREAD_R = "M 970,950 C 880,820 800,680 680,590 S 570,530 500,500";

function seedRand(i: number, n: number) {
  const v = Math.sin(n * 127.1 + i * 311.7) * 43758.5453;
  return v - Math.floor(v);
}

const DUST = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: 5 + seedRand(i, 1) * 90,
  y: 5 + seedRand(i, 2) * 90,
  size: 2 + seedRand(i, 3) * 3,
  dur: 4 + seedRand(i, 4) * 5,
  delay: seedRand(i, 5) * 4,
  drift: 10 + seedRand(i, 6) * 18,
}));

export default function Level3() {
  const { completeLevel } = useGame();
  const { play, haptic } = useSound();
  const [phase, setPhase] = useState<
    "intro" | "drawing" | "converged"
  >("intro");
  const doneRef = useRef(false);

  /* ── intro → drawing ────────────────────────────────── */
  useEffect(() => {
    const t = setTimeout(() => setPhase("drawing"), 1800);
    return () => clearTimeout(t);
  }, []);

  /* ── drawing → converged → next level ────────────── */
  useEffect(() => {
    if (phase !== "drawing") return;
    const convergeTimer = setTimeout(() => {
      haptic([15, 40, 15]);
      play("reveal");
      setPhase("converged");
    }, DRAW_DURATION * 1000);
    return () => clearTimeout(convergeTimer);
  }, [phase, haptic, play]);

  useEffect(() => {
    if (phase !== "converged") return;
    if (doneRef.current) return;
    doneRef.current = true;
    const t = setTimeout(() => completeLevel(3), 1200);
    return () => clearTimeout(t);
  }, [phase, completeLevel]);

  const isActive = phase === "drawing" || phase === "converged";
  const threadTarget = phase === "intro" ? 0 : 1;

  return (
    <motion.div
      className="relative h-full w-full overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.8 }}
    >
      {/* ambient glow — intensifies as threads draw */}
      <motion.div
        className="pointer-events-none absolute rounded-full blur-3xl"
        style={{
          width: 600,
          height: 600,
          top: "45%",
          left: "50%",
          translate: "-50% -50%",
          background: "radial-gradient(circle, rgba(212,175,55,0.07) 0%, rgba(170,120,35,0.02) 50%, transparent 70%)",
        }}
        animate={
          phase === "converged"
            ? { scale: 1.4, opacity: 1 }
            : phase === "drawing"
              ? { scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }
              : {}
        }
        transition={
          phase === "drawing"
            ? { duration: 4, repeat: Infinity, ease: "easeInOut" as const }
            : { duration: 1 }
        }
      />

      {/* ── floating gold dust ─────────────────────────── */}
      {isActive && (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          {DUST.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                background: "rgba(212,175,55,0.25)",
              }}
              animate={{
                y: [0, -p.drift, 0],
                x: [0, p.drift * 0.35, 0],
                opacity: [0, 0.45, 0],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: p.dur,
                delay: p.delay,
                repeat: Infinity,
                ease: "easeInOut" as const,
              }}
            />
          ))}
        </div>
      )}

      {/* ── intro ────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <motion.div
            key="intro"
            className="flex h-full items-center justify-center text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
          >
            <div>
              <h2 className="font-serif text-2xl tracking-widest text-amber-200/80 uppercase">
                Chapter III
              </h2>
              <p className="mt-2 text-lg text-amber-100/45">
                The Golden Thread
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── main scene ───────────────────────────────── */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            key="scene"
            className="absolute inset-0 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            {/* ── SVG threads ──────────────────────────── */}
            <svg
              className="pointer-events-none absolute inset-0 z-10 h-full w-full"
              viewBox="0 0 1000 1000"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="gL" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(212,175,55,0.06)" />
                  <stop offset="60%" stopColor="rgba(212,175,55,0.45)" />
                  <stop offset="100%" stopColor="rgba(255,230,150,0.7)" />
                </linearGradient>
                <linearGradient id="gR" x1="100%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="rgba(212,175,55,0.06)" />
                  <stop offset="60%" stopColor="rgba(212,175,55,0.45)" />
                  <stop offset="100%" stopColor="rgba(255,230,150,0.7)" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="4" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="softGlow">
                  <feGaussianBlur stdDeviation="8" />
                </filter>
              </defs>

              {/* faint full-path guides */}
              <path d={THREAD_L} fill="none" stroke="rgba(212,175,55,0.03)" strokeWidth="1" strokeDasharray="4 12" />
              <path d={THREAD_R} fill="none" stroke="rgba(212,175,55,0.03)" strokeWidth="1" strokeDasharray="4 12" />

              {/* soft outer glow — left */}
              <motion.path
                d={THREAD_L}
                fill="none"
                stroke="rgba(212,175,55,0.08)"
                strokeWidth="10"
                strokeLinecap="round"
                filter="url(#softGlow)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: threadTarget }}
                transition={{ duration: DRAW_DURATION, ease: [0.25, 0.1, 0.25, 1] }}
              />
              {/* inner glow — left */}
              <motion.path
                d={THREAD_L}
                fill="none"
                stroke="rgba(212,175,55,0.2)"
                strokeWidth="4"
                strokeLinecap="round"
                filter="url(#glow)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: threadTarget }}
                transition={{ duration: DRAW_DURATION, ease: [0.25, 0.1, 0.25, 1] }}
              />
              {/* core stroke — left */}
              <motion.path
                d={THREAD_L}
                fill="none"
                stroke="url(#gL)"
                strokeWidth="1.8"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: threadTarget }}
                transition={{ duration: DRAW_DURATION, ease: [0.25, 0.1, 0.25, 1] }}
              />

              {/* soft outer glow — right */}
              <motion.path
                d={THREAD_R}
                fill="none"
                stroke="rgba(212,175,55,0.08)"
                strokeWidth="10"
                strokeLinecap="round"
                filter="url(#softGlow)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: threadTarget }}
                transition={{ duration: DRAW_DURATION, ease: [0.25, 0.1, 0.25, 1] }}
              />
              {/* inner glow — right */}
              <motion.path
                d={THREAD_R}
                fill="none"
                stroke="rgba(212,175,55,0.2)"
                strokeWidth="4"
                strokeLinecap="round"
                filter="url(#glow)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: threadTarget }}
                transition={{ duration: DRAW_DURATION, ease: [0.25, 0.1, 0.25, 1] }}
              />
              {/* core stroke — right */}
              <motion.path
                d={THREAD_R}
                fill="none"
                stroke="url(#gR)"
                strokeWidth="1.8"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: threadTarget }}
                transition={{ duration: DRAW_DURATION, ease: [0.25, 0.1, 0.25, 1] }}
              />
            </svg>

            {/* ── small progress line at bottom ────────── */}
            {phase === "drawing" && (
              <div className="absolute bottom-[8%] left-1/2 z-20 -translate-x-1/2">
                <div className="h-[2px] w-24 overflow-hidden rounded-full bg-white/[0.04]">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, rgba(212,175,55,0.5), rgba(255,230,150,0.7))" }}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: DRAW_DURATION, ease: "linear" }}
                  />
                </div>
              </div>
            )}

            {/* ── convergence flash + knot ──────────────── */}
            <AnimatePresence>
              {phase === "converged" && (
                <motion.div
                  key="knot"
                  className="absolute z-40 flex flex-col items-center"
                  style={{
                    top: "50%",
                    left: "50%",
                    translate: "-50% -50%",
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* bright flash */}
                  <motion.div
                    className="absolute rounded-full"
                    style={{
                      width: 240,
                      height: 240,
                      background: "radial-gradient(circle, rgba(255,240,180,0.35) 0%, rgba(212,175,55,0.1) 35%, transparent 65%)",
                    }}
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: [0, 2.8, 2.2], opacity: [1, 0.7, 0] }}
                    transition={{ duration: 1.4, ease: "easeOut" as const }}
                  />

                  {/* golden knot — concentric rings */}
                  <div className="relative flex items-center justify-center">
                    {[48, 34, 22].map((size, i) => (
                      <motion.div
                        key={i}
                        className="absolute rounded-full"
                        style={{
                          width: size,
                          height: size,
                          border: `${1.5 - i * 0.3}px solid rgba(212,175,55,${0.4 - i * 0.08})`,
                          boxShadow: i === 2
                            ? "0 0 24px rgba(212,175,55,0.25), inset 0 0 12px rgba(212,175,55,0.12)"
                            : "none",
                        }}
                        initial={{ scale: 0, rotate: -120 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 280,
                          damping: 16,
                          delay: 0.1 + i * 0.14,
                        }}
                      />
                    ))}
                    <motion.div
                      className="relative rounded-full"
                      style={{
                        width: 9,
                        height: 9,
                        background: "radial-gradient(circle, rgba(255,230,150,0.9) 0%, rgba(212,175,55,0.55) 100%)",
                        boxShadow: "0 0 16px rgba(212,175,55,0.5)",
                      }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 12, delay: 0.55 }}
                    />
                  </div>

                  {/* burst particles */}
                  <div className="pointer-events-none absolute">
                    {Array.from({ length: 16 }).map((_, i) => {
                      const angle = (i / 16) * Math.PI * 2;
                      const dist = 45 + (i % 4) * 15;
                      return (
                        <motion.div
                          key={i}
                          className="absolute rounded-full"
                          style={{
                            width: 2.5 + (i % 3),
                            height: 2.5 + (i % 3),
                            background: `rgba(212,175,55,${0.35 + (i % 3) * 0.15})`,
                          }}
                          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                          animate={{
                            x: Math.cos(angle) * dist,
                            y: Math.sin(angle) * dist,
                            opacity: 0,
                            scale: 0,
                          }}
                          transition={{
                            duration: 0.65 + (i % 3) * 0.12,
                            ease: "easeOut" as const,
                            delay: 0.08,
                          }}
                        />
                      );
                    })}
                  </div>

                
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
