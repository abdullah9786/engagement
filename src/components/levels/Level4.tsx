"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useGame } from "@/context/GameContext";
import { useSound } from "@/hooks/useSound";

export default function Level4() {
  const { completeLevel } = useGame();
  const { play, haptic } = useSound();
  const [phase, setPhase] = useState<
    "dark" | "ring" | "drop" | "celebrate"
  >("dark");
  const confettiFired = useRef(false);

  /* ── phase timeline ───────────────────────────────── */
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("ring"), 900);
    const t2 = setTimeout(() => setPhase("drop"), 3000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  /* ── massive confetti on the drop ─────────────────── */
  useEffect(() => {
    if (phase !== "drop" || confettiFired.current) return;
    confettiFired.current = true;
    haptic([15, 40, 15, 40, 25]);
    play("celebrate");

    const colors = ["#d4af37", "#f5e6cc", "#f59e0b", "#fbbf24", "#ec4899"];

    confetti({
      particleCount: 60,
      angle: 60,
      spread: 65,
      origin: { x: 0, y: 0.65 },
      colors,
    });
    confetti({
      particleCount: 60,
      angle: 120,
      spread: 65,
      origin: { x: 1, y: 0.65 },
      colors,
    });
    setTimeout(() => {
      confetti({
        particleCount: 40,
        spread: 100,
        origin: { y: 0.45 },
        colors: colors.slice(0, 4),
      });
    }, 180);

    setTimeout(() => setPhase("celebrate"), 2200);
  }, [phase]);

  /* ── auto-advance after celebration ─────────────── */
  useEffect(() => {
    if (phase !== "celebrate") return;
    const t = setTimeout(() => completeLevel(4), 800);
    return () => clearTimeout(t);
  }, [phase, completeLevel]);

  /* ── handlers ─────────────────────────────────────── */
  const tapCelebrate = useCallback(
    (e: React.MouseEvent) => {
      if (phase !== "drop" && phase !== "celebrate") return;
      confetti({
        particleCount: 25,
        spread: 70,
        origin: {
          x: e.clientX / window.innerWidth,
          y: e.clientY / window.innerHeight,
        },
        colors: ["#d4af37", "#f5e6cc", "#f59e0b", "#ec4899", "#a78bfa"],
      });
    },
    [phase],
  );

  const revealed = phase === "drop" || phase === "celebrate";

  /* seeded random helper for floating hearts */
  const sr = (seed: number, i: number) => {
    const v = Math.sin(seed * 127.1 + i * 311.7) * 43758.5453;
    return v - Math.floor(v);
  };

  return (
    <motion.div
      className="relative h-full w-full overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      onClick={tapCelebrate}
    >
      {/* ── heartbeat pulse in the dark ────────────── */}
      {phase === "dark" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="rounded-full"
            style={{
              width: 180,
              height: 180,
              background:
                "radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 65%)",
            }}
            animate={{
              scale: [1, 1.7, 1, 1.5, 1],
              opacity: [0.25, 0.7, 0.12, 0.55, 0],
            }}
            transition={{ duration: 2.8, ease: "easeInOut" as const }}
          />
        </div>
      )}

      {/* ── ring SVG ───────────────────────────────── */}
      {(phase === "ring" || revealed) && (
        <motion.div
          className="absolute inset-0 z-10 flex items-center justify-center"
          animate={{
            y: revealed ? "-15vh" : "0vh",
            scale: revealed ? 0.6 : 1,
            opacity: revealed ? 0.85 : 1,
          }}
          transition={{ duration: 0.75, ease: "easeOut" as const }}
        >
          {/* glow behind ring */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 220,
              height: 220,
              background:
                "radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 60%)",
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 2 }}
          />

          <svg
            viewBox="0 0 100 100"
            className="relative h-32 w-32 sm:h-36 sm:w-36"
          >
            <defs>
              <linearGradient
                id="bandG4"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="45%" stopColor="#d4af37" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>

            {/* Band */}
            <motion.circle
              cx="50"
              cy="56"
              r="28"
              fill="none"
              stroke="url(#bandG4)"
              strokeWidth="3.5"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                duration: 1.6,
                ease: "easeOut" as const,
              }}
            />

            {/* Band shine */}
            <motion.circle
              cx="50"
              cy="56"
              r="28"
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1"
              strokeLinecap="round"
              strokeDasharray="8 60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, rotate: 360 }}
              transition={{
                opacity: { delay: 1.2, duration: 0.5 },
                rotate: { duration: 12, repeat: Infinity, ease: "linear" },
              }}
              style={{ transformOrigin: "50px 56px" }}
            />

            {/* Diamond outline */}
            <motion.path
              d="M 43 28 L 50 17 L 57 28 L 50 37 Z"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="1.5"
              strokeLinejoin="round"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 1.4,
                duration: 0.5,
                type: "spring",
              }}
              style={{ transformOrigin: "50px 27px" }}
            />

            {/* Diamond fill */}
            <motion.path
              d="M 43 28 L 50 17 L 57 28 L 50 37 Z"
              fill="rgba(251,191,36,0.25)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6, duration: 0.4 }}
            />

            {/* Sparkle at diamond tip */}
            <motion.circle
              cx="50"
              cy="17"
              r="2"
              fill="white"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 1, 0.25, 0.85, 0.25],
              }}
              transition={{
                delay: 1.8,
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut" as const,
              }}
            />
          </svg>
        </motion.div>
      )}

      {/* ── starburst light rays ───────────────────── */}
      {revealed && (
        <div
          className="pointer-events-none absolute inset-0 z-[5] overflow-hidden"
          style={{ translate: "0 -6%" }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute left-1/2 top-[43%] origin-bottom"
              style={{
                width: 1 + (i % 4) * 0.35,
                height: "55vh",
                transform: `translateX(-50%) rotate(${i * 30}deg)`,
                background: `linear-gradient(to top, rgba(212,175,55,${0.025 + (i % 3) * 0.012}), transparent 50%)`,
              }}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{
                duration: 1.3,
                delay: i * 0.018,
                ease: "easeOut" as const,
              }}
            />
          ))}
        </div>
      )}

      {/* ── expanding background glow ──────────────── */}
      <motion.div
        className="pointer-events-none absolute z-[1]"
        style={{ top: "43%", left: "50%", translate: "-50% -50%" }}
        initial={{ opacity: 0, scale: 0.2 }}
        animate={
          revealed
            ? { opacity: 1, scale: 1 }
            : { opacity: 0, scale: 0.2 }
        }
        transition={{ duration: 1.6, ease: "easeOut" as const }}
      >
        <div
          className="h-[450px] w-[450px] rounded-full md:h-[600px] md:w-[600px]"
          style={{
            background:
              "radial-gradient(circle, rgba(212,175,55,0.08) 0%, rgba(170,120,35,0.03) 40%, transparent 65%)",
          }}
        />
      </motion.div>

      {/* ── screen flash on drop ───────────────────── */}
      {phase === "drop" && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-40"
          style={{
            background:
              "radial-gradient(circle at 50% 43%, rgba(255,250,220,0.9) 0%, transparent 50%)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.9, 0] }}
          transition={{ duration: 1, times: [0, 0.1, 1] }}
        />
      )}

      {/* ── THE REVEAL TEXT ────────────────────────── */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* shake wrapper for the bass-drop impact */}
            <motion.div
              className="flex flex-col items-center gap-5 text-center"
              style={{ marginTop: "5vh" }}
              animate={
                phase === "drop"
                  ? {
                      x: [0, -5, 5, -3, 3, -1.5, 1, 0],
                      y: [0, -3, 2, -2, 1, -0.5, 0],
                    }
                  : {}
              }
              transition={{ duration: 0.45, delay: 0.08 }}
            >
              {/* main headline */}
              <motion.h1
                className="font-serif text-[2.1rem] leading-[1.15] font-light tracking-wide text-amber-100 sm:text-5xl md:text-[4.2rem]"
                initial={{
                  opacity: 0,
                  scale: 2.5,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                transition={{
                  duration: 1.1,
                  scale: {
                    type: "spring",
                    damping: 14,
                    stiffness: 65,
                  },
                }}
              >
                We&rsquo;re getting engaged
              </motion.h1>

              {/* ring emoji — bouncy drop-in */}
              <motion.div
                className="text-5xl sm:text-6xl md:text-7xl"
                initial={{
                  opacity: 0,
                  y: -50,
                  scale: 0,
                  rotate: -25,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  rotate: 0,
                }}
                transition={{
                  delay: 0.35,
                  type: "spring",
                  damping: 7,
                  stiffness: 90,
                }}
              >
                💍
              </motion.div>

              {/* divider with breathing heart */}
              <motion.div
                className="flex items-center gap-4"
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.9, duration: 0.8 }}
              >
                <div className="h-px w-10 bg-amber-400/25 sm:w-14" />
                <motion.span
                  className="text-sm text-amber-400/45"
                  animate={{
                    scale: [1, 1.25, 1],
                    opacity: [0.35, 0.65, 0.35],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut" as const,
                  }}
                >
                  ♥
                </motion.span>
                <div className="h-px w-10 bg-amber-400/25 sm:w-14" />
              </motion.div>

              {/* celebration hint */}
              <motion.p
                className="text-[0.7rem] tracking-[0.3em] text-amber-200/30 uppercase sm:text-xs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3, duration: 0.7 }}
              >
                tap anywhere to celebrate
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── floating hearts ────────────────────────── */}
      {revealed && (
        <div className="pointer-events-none absolute inset-0 z-[15] overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-amber-400/12"
              style={{
                left: `${10 + sr(1, i) * 80}%`,
                bottom: -20,
              }}
              animate={{
                y: -(
                  typeof window !== "undefined"
                    ? window.innerHeight + 60
                    : 900
                ),
                opacity: [0, 0.45, 0],
                rotate: sr(2, i) * 50 - 25,
                scale: 0.45 + sr(3, i) * 0.55,
              }}
              transition={{
                duration: 6 + sr(4, i) * 5,
                delay: i * 0.65 + 0.4,
                repeat: Infinity,
                ease: "easeOut" as const,
              }}
            >
              <svg
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </motion.div>
          ))}
        </div>
      )}

      
    </motion.div>
  );
}
