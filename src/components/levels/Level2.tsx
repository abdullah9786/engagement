"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/context/GameContext";
import { useSound } from "@/hooks/useSound";

interface Memory {
  id: number;
  icon: string;
  title: string;
  x: number;
  y: number;
  rotate: number;
  entryFrom: { x: number; y: number; r: number };
}

/*
 * Memories in chronological order (id = sequence position).
 * x / y = percentage positions — deliberately non-sequential
 * so the spatial layout doesn't telegraph the answer.
 */
const MEMORIES: Memory[] = [
  { id: 0, icon: "🤲", title: "A Prayer Answered", x: 65, y: 58, rotate: -4, entryFrom: { x: 120, y: 80, r: 25 } },
  { id: 1, icon: "💌", title: "The Rishta", x: 30, y: 26, rotate: 5, entryFrom: { x: -100, y: -60, r: -20 } },
  { id: 2, icon: "📸", title: "The First Photo", x: 78, y: 24, rotate: -2, entryFrom: { x: 90, y: -70, r: 18 } },
  { id: 3, icon: "👨‍👩‍👧‍👦", title: "The Families United", x: 26, y: 68, rotate: 4, entryFrom: { x: -110, y: 60, r: -22 } },
  { id: 4, icon: "✨", title: "The 'Yes'", x: 53, y: 42, rotate: -5, entryFrom: { x: 0, y: 120, r: 15 } },
];

const PROMPTS = [
  "It all started with a prayer\u2026",
  "Then one day, a name was spoken\u2026",
  "A picture that said a thousand words\u2026",
  "Two families became one story\u2026",
  "And the answer was written in the stars\u2026",
];

const WRONG_HINTS = [
  "Not this one\u2026 not yet",
  "That memory comes later\u2026",
  "Think about what came first\u2026",
  "Follow the story\u2026",
];

export default function Level2() {
  const { completeLevel } = useGame();
  const { play, haptic } = useSound();
  const [phase, setPhase] = useState<"intro" | "play" | "complete">("intro");
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);
  const [shaking, setShaking] = useState<number | null>(null);
  const [hint, setHint] = useState("");
  const [sparkle, setSparkle] = useState<{
    x: number;
    y: number;
    key: number;
  } | null>(null);
  const wrongStreak = useRef(0);

  /* ── phase timing ─────────────────────────────────── */
  useEffect(() => {
    const t = setTimeout(() => setPhase("play"), 1800);
    return () => clearTimeout(t);
  }, []);

  /* ── pick handler ─────────────────────────────────── */
  const handlePick = useCallback(
    (memory: Memory) => {
      if (
        phase !== "play" ||
        completed.includes(memory.id) ||
        shaking !== null
      )
        return;

      if (memory.id === step) {
        haptic(12);
        play("success");
        const next = [...completed, memory.id];
        setCompleted(next);
        setStep(step + 1);
        setHint("");
        wrongStreak.current = 0;

        setSparkle({ x: memory.x, y: memory.y, key: Date.now() });
        setTimeout(() => setSparkle(null), 850);

        if (next.length === MEMORIES.length) {
          setPhase("complete");
          setTimeout(() => completeLevel(2), 2000);
        }
      } else {
        haptic([5, 30, 5]);
        setShaking(memory.id);
        const idx = Math.min(wrongStreak.current, WRONG_HINTS.length - 1);
        setHint(WRONG_HINTS[idx]);
        wrongStreak.current++;
        setTimeout(() => setShaking(null), 650);
      }
    },
    [phase, step, completed, shaking, completeLevel],
  );

  const prompt =
    step < PROMPTS.length ? PROMPTS[step] : "Every moment led to this one\u2026";

  /* ── render ───────────────────────────────────────── */
  return (
    <motion.div
      className="relative h-full w-full overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.8 }}
    >
      {/* ambient glow — offset for asymmetry */}
      <div
        className="pointer-events-none absolute h-[520px] w-[520px] rounded-full bg-violet-500/[0.045] blur-xl"
        style={{ top: "28%", left: "42%", translate: "-50% -50%" }}
      />

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
              <h2 className="font-serif text-2xl tracking-widest text-violet-200/80 uppercase">
                Chapter II
              </h2>
              <p className="mt-2 text-lg text-violet-100/50">The Memories</p>
            </div>
          </motion.div>
        )}

        {/* ── play / complete ──────────────────────── */}
        {(phase === "play" || phase === "complete") && (
          <motion.div
            key="play"
            className="relative h-full w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            {/* ── prompt + progress ─────────────────── */}
            <div className="absolute top-[5%] right-0 left-0 z-30 px-6 text-center sm:top-[7%]">
              <motion.p
                key={prompt}
                className="font-serif text-lg text-violet-100/65 italic sm:text-xl md:text-2xl"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
              >
                &ldquo;{prompt}&rdquo;
              </motion.p>

              <div className="mt-3 flex justify-center gap-2">
                {MEMORIES.map((_, i) => (
                  <motion.div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      i < completed.length
                        ? "w-6 bg-amber-400/80"
                        : i === completed.length
                          ? "w-3 bg-amber-400/25"
                          : "w-1.5 bg-white/[0.07]"
                    }`}
                    layout
                  />
                ))}
              </div>

              <AnimatePresence>
                {hint && (
                  <motion.p
                    className="mt-3 text-sm text-rose-300/55 italic"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {hint}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* ── constellation threads ─────────────── */}
            <svg className="pointer-events-none absolute inset-0 z-10 h-full w-full">
              {completed.map((id, idx) => {
                if (idx === 0) return null;
                const from = MEMORIES[completed[idx - 1]];
                const to = MEMORIES[id];
                return (
                  <motion.line
                    key={`t-${completed[idx - 1]}-${id}`}
                    x1={`${from.x}%`}
                    y1={`${from.y}%`}
                    x2={`${to.x}%`}
                    y2={`${to.y}%`}
                    stroke={
                      phase === "complete"
                        ? "rgba(212,175,55,0.35)"
                        : "rgba(212,175,55,0.18)"
                    }
                    strokeWidth="1"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{
                      duration: 0.75,
                      ease: "easeOut" as const,
                    }}
                  />
                );
              })}

              {/* golden dots at completed positions */}
              {completed.map((id) => {
                const m = MEMORIES[id];
                return (
                  <motion.circle
                    key={`d-${id}`}
                    cx={`${m.x}%`}
                    cy={`${m.y}%`}
                    r="3"
                    fill="rgba(212,175,55,0.45)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.35 }}
                  />
                );
              })}
            </svg>

            {/* ── sparkle burst ─────────────────────── */}
            <AnimatePresence>
              {sparkle && (
                <div
                  key={sparkle.key}
                  className="pointer-events-none absolute z-40"
                  style={{
                    left: `${sparkle.x}%`,
                    top: `${sparkle.y}%`,
                    translate: "-50% -50%",
                  }}
                >
                  {Array.from({ length: 10 }).map((_, j) => {
                    const angle = (j / 10) * Math.PI * 2;
                    const dist = 30 + Math.random() * 25;
                    return (
                      <motion.div
                        key={j}
                        className="absolute h-1.5 w-1.5 rounded-full bg-amber-400"
                        initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                        animate={{
                          x: Math.cos(angle) * dist,
                          y: Math.sin(angle) * dist,
                          opacity: 0,
                          scale: 0,
                        }}
                        transition={{
                          duration: 0.55 + Math.random() * 0.2,
                          ease: "easeOut" as const,
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </AnimatePresence>

            {/* ── floating memory cards ─────────────── */}
            {MEMORIES.map((memory, i) => {
              const isDone = completed.includes(memory.id);
              const isShaking = shaking === memory.id;

              return (
                <motion.button
                  key={memory.id}
                  onClick={() => handlePick(memory)}
                  disabled={isDone || phase === "complete"}
                  className="group absolute z-20"
                  style={{
                    left: `${memory.x}%`,
                    top: `${memory.y}%`,
                    translate: "-50% -50%",
                  }}
                  initial={{ opacity: 0, scale: 0.45, y: 50 }}
                  animate={{
                    opacity:
                      phase === "complete" && !isDone
                        ? 0.12
                        : isDone
                          ? 0.5
                          : 1,
                    scale: isDone ? 0.85 : 1,
                    y: isDone ? 0 : [0, -7, 0],
                    rotate: isDone ? 0 : memory.rotate,
                  }}
                  transition={
                    isDone
                      ? {
                          duration: 0.5,
                          ease: "easeOut" as const,
                        }
                      : {
                          y: {
                            duration: 3.2 + i * 0.45,
                            repeat: Infinity,
                            ease: "easeInOut" as const,
                            delay: i * 0.35,
                          },
                          opacity: { duration: 0.5 },
                          scale: { duration: 0.5, delay: i * 0.1 },
                          rotate: { duration: 0.5 },
                        }
                  }
                  whileHover={
                    !isDone && phase === "play"
                      ? { scale: 1.12, y: -10, rotate: 0, zIndex: 25 }
                      : {}
                  }
                  whileTap={
                    !isDone && phase === "play" ? { scale: 0.94 } : {}
                  }
                >
                  <motion.div
                    className={`relative flex w-[7rem] flex-col items-center gap-1.5 rounded-2xl border px-3 py-3.5 transition-colors sm:w-[7.5rem] sm:gap-2 sm:px-4 sm:py-4 md:w-36 md:gap-3 md:px-5 md:py-5 ${
                      isDone
                        ? "border-amber-400/25 bg-amber-500/[0.07]"
                        : "border-violet-400/[0.1] bg-white/[0.025] hover:border-violet-300/25 hover:bg-white/[0.06]"
                    }`}
                    animate={
                      isShaking
                        ? { x: [-9, 9, -7, 7, -3, 3, 0] }
                        : { x: 0 }
                    }
                    transition={{ duration: 0.5 }}
                  >
                    {/* wrong-pick flash */}
                    <AnimatePresence>
                      {isShaking && (
                        <motion.div
                          className="absolute inset-0 rounded-2xl border border-rose-400/40 bg-rose-500/[0.07]"
                          initial={{ opacity: 1 }}
                          animate={{ opacity: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.6 }}
                        />
                      )}
                    </AnimatePresence>

                    {/* correct glow */}
                    {isDone && (
                      <motion.div
                        className="absolute inset-0 rounded-2xl bg-amber-400/[0.07]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.5, 0.15] }}
                        transition={{ duration: 0.8 }}
                      />
                    )}

                    {/* step badge */}
                    {isDone && (
                      <motion.div
                        className="absolute -top-2.5 -right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[0.6rem] font-bold text-amber-950"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 12 }}
                      >
                        {completed.indexOf(memory.id) + 1}
                      </motion.div>
                    )}

                    <span className="text-xl sm:text-2xl md:text-3xl">
                      {memory.icon}
                    </span>

                    <span
                      className={`text-center text-[0.6rem] leading-tight font-medium tracking-wider sm:text-xs md:text-sm ${
                        isDone
                          ? "text-amber-200/70"
                          : "text-violet-200/45 group-hover:text-violet-100/70"
                      }`}
                    >
                      {memory.title}
                    </span>
                  </motion.div>
                </motion.button>
              );
            })}

            {/* ── completion overlay ────────────────── */}
            <AnimatePresence>
              {phase === "complete" && (
                <motion.div
                  className="absolute inset-0 z-50 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 1 }}
                >
                  <div className="absolute inset-0 bg-[#07070f]/80" />
                  <motion.div
                    className="relative z-10 flex flex-col items-center gap-4 text-center px-8"
                    initial={{ opacity: 0, y: 24, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 1, duration: 0.8 }}
                  >
                    {/* decorative connected dots */}
                    <motion.svg
                      width="80"
                      height="12"
                      viewBox="0 0 80 12"
                      className="mb-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.4 }}
                      transition={{ delay: 1.2 }}
                    >
                      {[0, 20, 40, 60, 80].map((cx, i) => (
                        <circle
                          key={i}
                          cx={cx}
                          cy="6"
                          r="2"
                          fill="rgba(212,175,55,0.6)"
                        />
                      ))}
                      <line
                        x1="0"
                        y1="6"
                        x2="80"
                        y2="6"
                        stroke="rgba(212,175,55,0.25)"
                        strokeWidth="0.5"
                      />
                    </motion.svg>

                    <p className="font-serif text-2xl text-amber-200/90 md:text-3xl">
                      Every moment led to this one&hellip;
                    </p>
                    <p className="text-sm text-amber-100/35">
                      The path becomes clearer
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
