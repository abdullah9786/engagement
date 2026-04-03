"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/context/GameContext";
import { useSound } from "@/hooks/useSound";

const LETTER_LINES: { text: string; className?: string }[] = [
  { text: "My Dearest,", className: "font-semibold text-rose-200/90" },
  { text: "" },
  { text: "From the moment you walked" },
  { text: "into my life, everything changed." },
  { text: "" },
  { text: "Every laugh, every silence," },
  { text: "every ordinary moment with you\u2014" },
  { text: "became my favorite memory." },
  { text: "" },
  { text: "You are my today," },
  { text: "and all of my tomorrows." },
  { text: "" },
  { text: "This is just the beginning" },
  { text: "of our forever." },
  { text: "" },
  { text: "Yours, always \u2764\uFE0F", className: "font-semibold text-rose-200/90" },
];

export default function Level3() {
  const { completeLevel } = useGame();
  const { play, haptic } = useSound();
  const [phase, setPhase] = useState<
    "intro" | "sealed" | "opening" | "reading" | "complete"
  >("intro");
  const [sealHover, setSealHover] = useState(false);
  const [revealedLines, setRevealedLines] = useState(0);
  const [hearts, setHearts] = useState<
    { x: number; y: number; id: number }[]
  >([]);
  const doneRef = useRef(false);

  /* ── deterministic petals (safe for SSR since conditionally rendered) ── */
  const petals = useRef(
    Array.from({ length: 14 }, (_, i) => {
      const s = (n: number) => {
        const v = Math.sin(n * 127.1 + i * 311.7) * 43758.5453;
        return v - Math.floor(v);
      };
      return {
        id: i,
        x: 5 + s(1) * 90,
        delay: s(2) * 5,
        dur: 7 + s(3) * 5,
        size: 5 + s(4) * 5,
        sway: 15 + s(5) * 35,
        hue: 335 + s(6) * 25,
      };
    }),
  ).current;

  /* ── phase timing ─────────────────────────────────── */
  useEffect(() => {
    const t = setTimeout(() => setPhase("sealed"), 1800);
    return () => clearTimeout(t);
  }, []);

  /* ── line-by-line reveal ──────────────────────────── */
  useEffect(() => {
    if (phase !== "reading") return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setRevealedLines(i);
      if (i >= LETTER_LINES.length) {
        clearInterval(id);
        setTimeout(() => {
          setPhase("complete");
          if (!doneRef.current) {
            doneRef.current = true;
            setTimeout(() => completeLevel(3), 2000);
          }
        }, 1000);
      }
    }, 260);
    return () => clearInterval(id);
  }, [phase, completeLevel]);

  /* ── handlers ─────────────────────────────────────── */
  const openEnvelope = useCallback(() => {
    if (phase !== "sealed") return;
    haptic(15);
    play("tap");
    setPhase("opening");
    setTimeout(() => {
      play("reveal");
      setPhase("reading");
    }, 1800);
  }, [phase, haptic, play]);

  const spawnHeart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (phase !== "complete") return;
      const pos = "touches" in e ? e.touches[0] : e;
      if (!pos) return;
      setHearts((prev) => [
        ...prev.slice(-10),
        { x: pos.clientX, y: pos.clientY, id: Date.now() + Math.random() },
      ]);
    },
    [phase],
  );

  const showEnvelope = phase === "sealed" || phase === "opening";
  const showLetter = phase === "reading" || phase === "complete";
  const showPetals = phase === "reading" || phase === "complete";

  /* ── render ───────────────────────────────────────── */
  return (
    <motion.div
      className="relative h-full w-full overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.8 }}
      onClick={spawnHeart}
      onTouchStart={spawnHeart}
    >
      {/* ambient glow */}
      <div
        className="pointer-events-none absolute h-[500px] w-[500px] rounded-full bg-rose-500/[0.04] blur-3xl"
        style={{ top: "38%", left: "48%", translate: "-50% -50%" }}
      />

      {/* ── falling petals ───────────────────────────── */}
      {showPetals && (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          {petals.map((p) => (
            <motion.div
              key={p.id}
              className="absolute"
              style={{
                left: `${p.x}%`,
                width: p.size,
                height: p.size * 0.6,
                background: `hsla(${p.hue}, 60%, 68%, 0.18)`,
                borderRadius: "50% 0 50% 50%",
              }}
              initial={{ y: "-5vh", opacity: 0, rotate: 0 }}
              animate={{
                y: "110vh",
                opacity: [0, 0.5, 0.5, 0],
                rotate: 360,
                x: [0, p.sway, -p.sway * 0.6, p.sway * 0.3],
              }}
              transition={{
                duration: p.dur,
                delay: p.delay,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}
        </div>
      )}

      {/* ── tap-spawned hearts ───────────────────────── */}
      <AnimatePresence>
        {hearts.map((h) => (
          <motion.div
            key={h.id}
            className="pointer-events-none fixed z-50 text-lg text-rose-400/60"
            style={{ left: h.x - 9, top: h.y - 9 }}
            initial={{ y: 0, opacity: 1, scale: 1 }}
            animate={{ y: -70, opacity: 0, scale: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" as const }}
            onAnimationComplete={() =>
              setHearts((prev) => prev.filter((p) => p.id !== h.id))
            }
          >
            ♥
          </motion.div>
        ))}
      </AnimatePresence>

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
              <h2 className="font-serif text-2xl tracking-widest text-rose-200/80 uppercase">
                Chapter III
              </h2>
              <p className="mt-2 text-lg text-rose-100/50">The Letter</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── envelope ─────────────────────────────────── */}
      <AnimatePresence>
        {showEnvelope && (
          <motion.div
            key="envelope"
            className="absolute inset-0 z-10 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{
              opacity: 0,
              scale: 0.55,
              y: 120,
              filter: "blur(10px)",
              transition: { duration: 0.9, ease: "easeIn" as const },
            }}
            transition={{ duration: 0.7 }}
          >
            <div
              className="flex flex-col items-center gap-8"
              style={{ marginTop: "-5vh" }}
            >
              {/* whisper prompt */}
              <motion.p
                className="text-[0.7rem] tracking-[0.4em] text-rose-200/25 uppercase"
                animate={{ opacity: [0.15, 0.4, 0.15] }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "easeInOut" as const,
                }}
              >
                a letter awaits
              </motion.p>

              {/* envelope body */}
              <motion.button
                onClick={openEnvelope}
                onMouseEnter={() => setSealHover(true)}
                onMouseLeave={() => setSealHover(false)}
                className="group relative cursor-pointer select-none focus:outline-none"
                style={{ perspective: "900px" }}
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                animate={
                  phase !== "opening"
                    ? {
                        y: [0, -6, 0],
                        rotate: [0, 0.6, 0, -0.6, 0],
                      }
                    : { y: 0, rotate: 0 }
                }
                transition={{
                  y: {
                    duration: 3.8,
                    repeat: phase !== "opening" ? Infinity : 0,
                    ease: "easeInOut" as const,
                  },
                  rotate: {
                    duration: 5.5,
                    repeat: phase !== "opening" ? Infinity : 0,
                    ease: "easeInOut" as const,
                  },
                }}
              >
                {/* body rectangle */}
                <div
                  className="relative h-[175px] w-[265px] overflow-hidden rounded-lg shadow-2xl shadow-black/40 sm:h-[195px] sm:w-[295px] md:h-[215px] md:w-[330px]"
                  style={{
                    background:
                      "linear-gradient(145deg, #f5e6cc 0%, #e8d0ac 55%, #dcc4a0 100%)",
                  }}
                >
                  {/* inner V-fold lines */}
                  <svg
                    className="absolute inset-0 h-full w-full"
                    viewBox="0 0 330 215"
                    preserveAspectRatio="none"
                  >
                    <line
                      x1="0"
                      y1="0"
                      x2="165"
                      y2="88"
                      stroke="rgba(0,0,0,0.035)"
                      strokeWidth="0.8"
                    />
                    <line
                      x1="330"
                      y1="0"
                      x2="165"
                      y2="88"
                      stroke="rgba(0,0,0,0.035)"
                      strokeWidth="0.8"
                    />
                  </svg>

                  {/* "For You" */}
                  <div className="absolute inset-0 flex items-end justify-center pb-7 sm:pb-8">
                    <p className="font-serif text-base italic tracking-wide text-[#a08060]/35 sm:text-lg">
                      For You
                    </p>
                  </div>

                  {/* paper grain */}
                  <div
                    className="absolute inset-0 opacity-[0.025]"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, transparent 3px)",
                    }}
                  />
                </div>

                {/* flap (triangle, 3D open) */}
                <motion.div
                  className="absolute top-0 left-0 right-0 z-10 rounded-t-lg"
                  style={{
                    height: "54%",
                    clipPath: "polygon(0% 0%, 100% 0%, 50% 100%)",
                    background:
                      "linear-gradient(180deg, #eddbb8 0%, #dcc4a0 100%)",
                    transformOrigin: "center top",
                    backfaceVisibility: "hidden",
                  }}
                  animate={{
                    rotateX: phase === "opening" ? -170 : 0,
                  }}
                  transition={{
                    duration: 0.75,
                    ease: [0.4, 0, 0.2, 1],
                    delay: phase === "opening" ? 0.25 : 0,
                  }}
                />

                {/* wax seal */}
                <AnimatePresence>
                  {phase === "sealed" && (
                    <motion.div
                      className="absolute z-20 flex items-center justify-center rounded-full shadow-lg"
                      style={{
                        top: "38%",
                        left: "50%",
                        translate: "-50% -50%",
                        width: 46,
                        height: 46,
                        background:
                          "radial-gradient(circle at 38% 38%, #c03030, #8b1a1a 55%, #6b1010)",
                        border: "2px solid rgba(90,14,14,0.7)",
                      }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        animate={{
                          boxShadow: sealHover
                            ? "0 0 22px 5px rgba(220,110,60,0.45)"
                            : "0 0 8px 1px rgba(180,60,30,0.15)",
                        }}
                        transition={{ duration: 0.4 }}
                      />
                      <span className="select-none text-base text-amber-300/80">
                        ♥
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* seal fragments on break */}
                {phase === "opening" && (
                  <div
                    className="pointer-events-none absolute z-30"
                    style={{
                      top: "38%",
                      left: "50%",
                      translate: "-50% -50%",
                    }}
                  >
                    {Array.from({ length: 8 }).map((_, i) => {
                      const a =
                        (i / 8) * Math.PI * 2 +
                        ((i % 3) - 1) * 0.35;
                      const d = 30 + (i % 3) * 12;
                      return (
                        <motion.div
                          key={i}
                          className="absolute rounded-sm"
                          style={{
                            width: 5 + (i % 3) * 2.5,
                            height: 4 + (i % 2) * 2,
                            background: `hsl(${2 + i * 3}, 62%, ${22 + i * 3}%)`,
                          }}
                          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                          animate={{
                            x: Math.cos(a) * d,
                            y: Math.sin(a) * d - 12,
                            opacity: 0,
                            rotate: (i - 4) * 35,
                          }}
                          transition={{
                            duration: 0.45 + (i % 3) * 0.1,
                            ease: "easeOut" as const,
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </motion.button>

              {/* tap hint */}
              <motion.div
                className="flex flex-col items-center gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: phase === "sealed" ? 1 : 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <motion.div
                  className="h-5 w-px bg-gradient-to-b from-rose-300/20 to-transparent"
                  animate={{
                    scaleY: [1, 1.4, 1],
                    opacity: [0.25, 0.45, 0.25],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut" as const,
                  }}
                />
                <motion.p
                  className="text-[0.6rem] tracking-[0.45em] text-rose-300/18 uppercase"
                  animate={{ opacity: [0.1, 0.3, 0.1] }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    ease: "easeInOut" as const,
                  }}
                >
                  tap to open
                </motion.p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── letter ───────────────────────────────────── */}
      <AnimatePresence>
        {showLetter && (
          <motion.div
            key="letter"
            className="absolute inset-0 z-20 flex items-center justify-center px-5 sm:px-8"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.9,
              ease: "easeOut" as const,
              delay: 0.15,
            }}
          >
            {/* soft backdrop blur */}
            <div className="pointer-events-none absolute inset-0 bg-[#07070f]/25 backdrop-blur-[2px]" />

            {/* paper */}
            <motion.div
              className="relative z-10 w-full max-w-md rounded-2xl border border-white/[0.05] px-7 py-8 sm:px-10 sm:py-10"
              style={{
                background:
                  "linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)",
                boxShadow:
                  "0 30px 70px rgba(0,0,0,0.35), 0 0 100px rgba(190,100,80,0.035)",
              }}
              initial={{ scale: 0.88 }}
              animate={{
                scale: 1,
                boxShadow:
                  phase === "complete"
                    ? "0 30px 70px rgba(0,0,0,0.35), 0 0 120px rgba(212,175,55,0.06)"
                    : "0 30px 70px rgba(0,0,0,0.35), 0 0 100px rgba(190,100,80,0.035)",
              }}
              transition={{ duration: 0.7, ease: "easeOut" as const }}
            >
              {/* top accent line */}
              <motion.div
                className="mx-auto mb-7 h-px w-14 bg-gradient-to-r from-transparent via-rose-400/25 to-transparent"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 0.4 }}
              />

              {/* letter text */}
              <div className="space-y-0">
                {LETTER_LINES.map((line, i) => (
                  <motion.p
                    key={i}
                    className={`font-serif text-[0.92rem] leading-[2.1] sm:text-base sm:leading-[2.15] md:text-[1.05rem] md:leading-[2.2] ${
                      line.className || "text-rose-100/65"
                    }`}
                    style={{ minHeight: line.text === "" ? "0.7em" : undefined }}
                    initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
                    animate={
                      i < revealedLines
                        ? { opacity: 1, y: 0, filter: "blur(0px)" }
                        : {}
                    }
                    transition={{ duration: 0.4, ease: "easeOut" as const }}
                  >
                    {line.text}
                  </motion.p>
                ))}
              </div>

              {/* writing cursor */}
              <AnimatePresence>
                {phase === "reading" && revealedLines < LETTER_LINES.length && (
                  <motion.div
                    className="mt-1 h-4 w-[2px] bg-rose-300/50"
                    animate={{ opacity: [1, 1, 0, 0] }}
                    transition={{
                      duration: 0.9,
                      repeat: Infinity,
                      times: [0, 0.49, 0.5, 1],
                      ease: "linear" as const,
                    }}
                    exit={{ opacity: 0 }}
                  />
                )}
              </AnimatePresence>

              {/* bottom accent line */}
              <motion.div
                className="mx-auto mt-7 h-px w-14 bg-gradient-to-r from-transparent via-amber-400/25 to-transparent"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={
                  revealedLines >= LETTER_LINES.length
                    ? { scaleX: 1, opacity: 1 }
                    : {}
                }
                transition={{ duration: 1 }}
              />
            </motion.div>

            {/* completion whisper */}
            <AnimatePresence>
              {phase === "complete" && (
                <motion.div
                  className="absolute bottom-[10%] left-0 right-0 z-20 flex flex-col items-center gap-3 sm:bottom-[12%]"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                >
                  <motion.div
                    className="text-xl text-rose-400/40"
                    animate={{
                      scale: [1, 1.15, 1],
                      opacity: [0.3, 0.55, 0.3],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "easeInOut" as const,
                    }}
                  >
                    ♥
                  </motion.div>
                  <p className="text-[0.65rem] tracking-[0.35em] text-rose-200/25 uppercase">
                    sealed with love
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
