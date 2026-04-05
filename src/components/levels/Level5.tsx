"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useGame } from "@/context/GameContext";
import { useSound } from "@/hooks/useSound";

const HOLD_MS = 3000;
const TICK_MS = 40;

const CRACK_ANGLES = [18, 72, 128, 195, 252, 310];

export default function Level5() {
  const { completeLevel } = useGame();
  const { play, haptic } = useSound();
  const [phase, setPhase] = useState<"intro" | "sealed" | "shatter">("intro");
  const [sealHover, setSealHover] = useState(false);
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const ivRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const vibeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef(0);
  const doneRef = useRef(false);

  const sr = (seed: number, i: number) => {
    const v = Math.sin(seed * 127.1 + i * 311.7) * 43758.5453;
    return v - Math.floor(v);
  };

  /* ── timing ───────────────────────────────────────── */
  useEffect(() => {
    const t = setTimeout(() => setPhase("sealed"), 1800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    return () => {
      if (ivRef.current) clearInterval(ivRef.current);
      if (vibeRef.current) clearInterval(vibeRef.current);
    };
  }, []);

  /* ── tap to start auto-reveal ─────────────────────── */
  const startReveal = useCallback(() => {
    if (doneRef.current || phase !== "sealed" || holding) return;
    haptic(15);
    play("heartbeat");
    setHolding(true);
    progressRef.current = 0;

    vibeRef.current = setInterval(() => {
      const intensity = 10 + Math.floor(progressRef.current / 4);
      haptic(intensity);
    }, 150);

    ivRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (TICK_MS / HOLD_MS) * 100;
        progressRef.current = next;
        if (next >= 100) {
          if (ivRef.current) clearInterval(ivRef.current);
          if (vibeRef.current) clearInterval(vibeRef.current);
          doneRef.current = true;
          setHolding(false);
          haptic([25, 40, 25, 40, 50]);
          play("shatter");
          setPhase("shatter");

          confetti({
            particleCount: 70,
            spread: 90,
            origin: { y: 0.42 },
            colors: ["#d4af37", "#f5e6cc", "#f59e0b", "#fbbf24"],
          });
          confetti({
            particleCount: 35,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.5 },
            colors: ["#d4af37", "#fbbf24"],
          });
          confetti({
            particleCount: 35,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.5 },
            colors: ["#d4af37", "#fbbf24"],
          });

          setTimeout(() => completeLevel(5), 2000);
          return 100;
        }
        return next;
      });
    }, TICK_MS);
  }, [phase, holding, completeLevel]);

  const circ = 2 * Math.PI * 44;
  const dashOff = circ - (progress / 100) * circ;

  /* ── render ───────────────────────────────────────── */
  return (
    <motion.div
      className="relative h-full w-full overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.8 }}
    >
      {/* intensifying ambient glow */}
      <motion.div
        className="pointer-events-none absolute z-0"
        style={{ top: "40%", left: "50%", translate: "-50% -50%" }}
      >
        <div
          className="rounded-full"
          style={{
            width: 400,
            height: 400,
            background: `radial-gradient(circle, rgba(212,175,55,${0.04 + progress * 0.0015}) 0%, transparent 60%)`,
            transform: `scale(${1 + progress * 0.005})`,
            transition: "transform 0.1s, background 0.1s",
          }}
        />
      </motion.div>

      <AnimatePresence mode="wait">
        {/* ── intro ────────────────────────────────── */}
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
                Chapter V
              </h2>
              <p className="mt-2 text-lg text-amber-100/50">The Reveal</p>
            </div>
          </motion.div>
        )}

        {/* ── sealed — the main interaction ────────── */}
        {phase === "sealed" && (
          <motion.div
            key="sealed"
            className="flex h-full flex-col items-center justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{
              opacity: 0,
              scale: 1.2,
              transition: { duration: 0.7 },
            }}
            transition={{ duration: 0.7 }}
          >
            {/* prompt */}
            <motion.p
              className="mb-10 font-serif text-lg text-amber-100/60 italic sm:text-xl md:text-2xl"
              style={{ marginTop: "-10vh" }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              One last step&hellip;
            </motion.p>

            {/* ── THE SEAL ──────────────────────────── */}
            <motion.div
              className="relative flex select-none items-center justify-center"
              onClick={startReveal}
              onPointerEnter={() => setSealHover(true)}
              onPointerLeave={() => setSealHover(false)}
              style={{
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
                touchAction: "none",
              }}
              animate={
                holding
                  ? {
                      x: [
                        -(progress / 25),
                        progress / 25,
                        -(progress / 32),
                        progress / 32,
                        0,
                      ],
                    }
                  : { x: 0 }
              }
              transition={
                holding
                  ? { duration: 0.15, repeat: Infinity }
                  : { duration: 0.35, type: "spring" as const }
              }
            >
              {/* light bleeding through cracks */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  width: 230,
                  height: 230,
                  background: `radial-gradient(circle, rgba(255,245,190,${progress * 0.004}) 0%, transparent 50%)`,
                  transform: `scale(${1 + progress * 0.005})`,
                  transition: "transform 0.08s, background 0.08s",
                }}
              />

              <svg
                viewBox="0 0 100 100"
                className="relative h-44 w-44 sm:h-52 sm:w-52 md:h-56 md:w-56"
              >
                <defs>
                  <radialGradient id="sealBg5">
                    <stop
                      offset="0%"
                      stopColor={`rgba(251,191,36,${0.16 + progress * 0.002})`}
                    />
                    <stop
                      offset="65%"
                      stopColor="rgba(212,175,55,0.09)"
                    />
                    <stop
                      offset="100%"
                      stopColor="rgba(180,130,40,0.04)"
                    />
                  </radialGradient>
                  <linearGradient
                    id="progG5"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#d4af37" />
                  </linearGradient>
                </defs>

                {/* outer decorative dots — light up with progress */}
                {Array.from({ length: 32 }).map((_, i) => {
                  const a = (i / 32) * Math.PI * 2;
                  const lit = progress > (i / 32) * 100;
                  return (
                    <circle
                      key={i}
                      cx={50 + Math.cos(a) * 46.5}
                      cy={50 + Math.sin(a) * 46.5}
                      r="0.65"
                      fill={
                        lit
                          ? "rgba(251,191,36,0.55)"
                          : "rgba(212,175,55,0.12)"
                      }
                      style={{ transition: "fill 0.15s" }}
                    />
                  );
                })}

                {/* progress ring track */}
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="rgba(212,175,55,0.06)"
                  strokeWidth="2"
                />
                {/* progress ring fill */}
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="url(#progG5)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  strokeDashoffset={dashOff}
                  transform="rotate(-90 50 50)"
                  style={{
                    transition: `stroke-dashoffset ${TICK_MS}ms linear`,
                  }}
                />

                {/* seal body */}
                <circle
                  cx="50"
                  cy="50"
                  r="36"
                  fill="url(#sealBg5)"
                  stroke="rgba(212,175,55,0.18)"
                  strokeWidth="0.7"
                />

                {/* inner decorative dashed ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="29"
                  fill="none"
                  stroke="rgba(212,175,55,0.08)"
                  strokeWidth="0.35"
                  strokeDasharray="1.2 2.8"
                />

                {/* center heart */}
                <path
                  d="M50 58 C50 58 39 50 39 44.5 C39 41 42 38.5 45.5 40 C47.5 41 49 43 50 44.2 C51 43 52.5 41 54.5 40 C58 38.5 61 41 61 44.5 C61 50 50 58 50 58Z"
                  fill={`rgba(212,175,55,${0.25 + progress * 0.005})`}
                  stroke={`rgba(212,175,55,${0.35 + progress * 0.005})`}
                  strokeWidth="0.45"
                  strokeLinejoin="round"
                />

                {/* cracks radiating from center */}
                {CRACK_ANGLES.map((deg, i) => {
                  const rad = (deg * Math.PI) / 180;
                  const len = 3 + (progress / 100) * 30;
                  const jitter =
                    ((i % 2) * 2 - 1) * 1.8 * (progress / 100);
                  const opacity =
                    progress > 6
                      ? Math.min(progress / 50, 0.75)
                      : 0;
                  return (
                    <g key={i}>
                      <line
                        x1="50"
                        y1="50"
                        x2={50 + Math.cos(rad) * len}
                        y2={50 + Math.sin(rad) * len + jitter}
                        stroke={`rgba(255,245,190,${opacity})`}
                        strokeWidth={0.25 + progress * 0.009}
                        strokeLinecap="round"
                      />
                      {/* glowing tip */}
                      {progress > 25 && (
                        <circle
                          cx={50 + Math.cos(rad) * len}
                          cy={
                            50 + Math.sin(rad) * len + jitter
                          }
                          r={0.6 + progress * 0.022}
                          fill={`rgba(255,245,190,${Math.min((progress - 25) / 120, 0.4)})`}
                        />
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* spark particles escaping from cracks */}
              {holding && progress > 35 && (
                <div className="pointer-events-none absolute inset-0">
                  {Array.from({ length: 8 }).map((_, i) => {
                    const a = sr(1, i) * Math.PI * 2;
                    const d = 90 + sr(2, i) * 35;
                    return (
                      <motion.div
                        key={i}
                        className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-amber-300/70"
                        animate={{
                          x: [0, Math.cos(a) * d],
                          y: [0, Math.sin(a) * d - 18],
                          opacity: [0.65, 0],
                          scale: [1, 0],
                        }}
                        transition={{
                          duration: 0.65,
                          delay: i * 0.07,
                          repeat: Infinity,
                          ease: "easeOut" as const,
                        }}
                      />
                    );
                  })}
                </div>
              )}

              {/* idle breathing pulse + hover glow */}
              {!holding && progress === 0 && (
                <>
                  <motion.div
                    className="absolute rounded-full border border-amber-400/[0.08]"
                    style={{ width: 210, height: 210 }}
                    animate={{
                      scale: [1, 1.08, 1],
                      opacity: [0.5, 0.9, 0.5],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut" as const,
                    }}
                  />
                  <motion.div
                    className="absolute rounded-full"
                    style={{ width: 230, height: 230 }}
                    animate={{
                      opacity: sealHover ? 0.5 : 0,
                      scale: sealHover ? 1.03 : 1,
                    }}
                    transition={{ duration: 0.35 }}
                  />
                </>
              )}
            </motion.div>

            {/* instruction text */}
            <div className="mt-10 flex flex-col items-center gap-3">
              <AnimatePresence mode="wait">
                {holding ? (
                  <motion.p
                    key="prog"
                    className="text-sm tracking-wider text-amber-200/50"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {progress < 30
                      ? "Revealing\u2026"
                      : progress < 65
                        ? "The seal weakens\u2026"
                        : "Almost\u2026"}
                  </motion.p>
                ) : (
                  <motion.p
                    key="idle"
                    className="text-xs tracking-[0.35em] text-amber-300/60 uppercase sm:text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.5, 0.85, 0.5] }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut" as const,
                    }}
                  >
                    tap to reveal
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* ── shatter ──────────────────────────────── */}
        {phase === "shatter" && (
          <motion.div
            key="shatter"
            className="flex h-full items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* radial flash */}
            <motion.div
              className="pointer-events-none fixed inset-0 z-40"
              style={{
                background:
                  "radial-gradient(circle at 50% 40%, rgba(255,250,220,0.9) 0%, transparent 50%)",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.95, 0] }}
              transition={{ duration: 1.2, times: [0, 0.1, 1] }}
            />

            {/* flying fragments */}
            <div
              className="pointer-events-none absolute z-30"
              style={{
                top: "40%",
                left: "50%",
                translate: "-50% -50%",
              }}
            >
              {Array.from({ length: 10 }).map((_, i) => {
                const a =
                  (i / 10) * Math.PI * 2 + (sr(1, i) - 0.5) * 0.5;
                const d = 70 + sr(2, i) * 160;
                const sz = 7 + sr(3, i) * 16;
                return (
                  <motion.div
                    key={i}
                    className="absolute rounded-sm"
                    style={{
                      width: sz,
                      height: sz * (0.45 + sr(4, i) * 0.4),
                      background: `linear-gradient(${sr(5, i) * 360}deg, rgba(212,175,55,0.65), rgba(251,191,36,0.35))`,
                    }}
                    initial={{
                      x: 0,
                      y: 0,
                      opacity: 1,
                      rotate: 0,
                      scale: 1,
                    }}
                    animate={{
                      x: Math.cos(a) * d,
                      y: Math.sin(a) * d + 45,
                      opacity: 0,
                      rotate: (sr(6, i) - 0.5) * 440,
                      scale: 0.2,
                    }}
                    transition={{
                      duration: 0.65 + sr(7, i) * 0.4,
                      ease: "easeOut" as const,
                    }}
                  />
                );
              })}
            </div>

            {/* expanding golden glow */}
            <motion.div
              className="pointer-events-none absolute z-10 h-[200px] w-[200px] rounded-full"
              style={{
                top: "40%",
                left: "50%",
                translate: "-50% -50%",
                background:
                  "radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 60%)",
              }}
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 4, opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" as const }}
            />

            {/* completion text */}
            <motion.div
              className="relative z-20 flex flex-col items-center gap-3 text-center"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 0.55,
                duration: 0.8,
                type: "spring" as const,
              }}
            >
              <motion.p
                className="font-serif text-2xl text-amber-200/90 sm:text-3xl"
                initial={{ y: 12 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                The moment has arrived&hellip;
              </motion.p>
              <motion.p
                className="text-sm text-amber-100/35"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                Your invitation awaits&hellip;
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
