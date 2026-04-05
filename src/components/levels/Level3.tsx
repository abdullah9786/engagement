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
              scale: 0.5,
              y: 140,
              filter: "blur(12px)",
              transition: { duration: 1, ease: "easeIn" as const },
            }}
            transition={{ duration: 0.7 }}
          >
            <div
              className="flex flex-col items-center gap-8"
              style={{ marginTop: "-4vh" }}
            >
              {/* whisper prompt */}
              <motion.p
                className="font-serif text-[0.72rem] tracking-[0.4em] text-rose-200/30 uppercase italic"
                animate={{ opacity: [0.18, 0.45, 0.18] }}
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
                style={{ perspective: "1000px" }}
                whileHover={{ y: -6, scale: 1.025 }}
                whileTap={{ scale: 0.97 }}
                animate={
                  phase !== "opening"
                    ? {
                        y: [0, -7, 0],
                        rotate: [0, 0.5, 0, -0.5, 0],
                      }
                    : { y: 0, rotate: 0 }
                }
                transition={{
                  y: {
                    duration: 4,
                    repeat: phase !== "opening" ? Infinity : 0,
                    ease: "easeInOut" as const,
                  },
                  rotate: {
                    duration: 5.8,
                    repeat: phase !== "opening" ? Infinity : 0,
                    ease: "easeInOut" as const,
                  },
                }}
              >
                {/* warm ambient glow behind envelope */}
                <div
                  className="pointer-events-none absolute z-0 rounded-full"
                  style={{
                    width: "130%",
                    height: "130%",
                    top: "50%",
                    left: "50%",
                    translate: "-50% -50%",
                    background: "radial-gradient(circle, rgba(212,175,55,0.06) 0%, rgba(190,100,60,0.03) 40%, transparent 65%)",
                    filter: "blur(20px)",
                  }}
                />

                {/* contact shadow */}
                <div
                  className="pointer-events-none absolute z-0"
                  style={{
                    width: "75%",
                    height: "16px",
                    bottom: "-12px",
                    left: "12.5%",
                    background: "radial-gradient(ellipse, rgba(0,0,0,0.35) 0%, transparent 70%)",
                    filter: "blur(6px)",
                  }}
                />

                {/* body rectangle */}
                <div
                  className="relative z-10 h-[180px] w-[275px] overflow-hidden rounded-xl sm:h-[200px] sm:w-[310px] md:h-[220px] md:w-[345px]"
                  style={{
                    background:
                      "linear-gradient(155deg, #f7ebda 0%, #eedcc0 30%, #e4cda8 65%, #d9c19a 100%)",
                    boxShadow:
                      "0 20px 60px rgba(0,0,0,0.35), 0 8px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.06)",
                  }}
                >
                  {/* gold border trim */}
                  <div
                    className="pointer-events-none absolute inset-[5px] z-10 rounded-[7px]"
                    style={{
                      border: "0.5px solid rgba(180,140,60,0.18)",
                      boxShadow: "inset 0 0 12px rgba(180,140,60,0.04)",
                    }}
                  />

                  {/* inner V-fold lines — thicker, with shadow */}
                  <svg
                    className="absolute inset-0 z-[5] h-full w-full"
                    viewBox="0 0 345 220"
                    preserveAspectRatio="none"
                  >
                    <line x1="0" y1="0" x2="172.5" y2="95" stroke="rgba(160,120,70,0.08)" strokeWidth="1.2" />
                    <line x1="345" y1="0" x2="172.5" y2="95" stroke="rgba(160,120,70,0.08)" strokeWidth="1.2" />
                    <line x1="0" y1="0" x2="172.5" y2="95" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                    <line x1="345" y1="0" x2="172.5" y2="95" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                  </svg>

                  {/* subtle damask/filigree pattern overlay */}
                  <div
                    className="pointer-events-none absolute inset-0 z-[4] opacity-[0.02]"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(45deg, transparent, transparent 12px, rgba(160,120,70,0.5) 12px, transparent 13px), repeating-linear-gradient(-45deg, transparent, transparent 12px, rgba(160,120,70,0.5) 12px, transparent 13px)",
                    }}
                  />

                  {/* "For You" — calligraphic */}
                  <div className="absolute inset-0 z-[6] flex items-end justify-center pb-6 sm:pb-7">
                    <p className="font-serif text-[1.05rem] italic tracking-wide text-[#a08060]/30 sm:text-lg"
                       style={{ textShadow: "0 1px 1px rgba(255,255,255,0.15)" }}>
                      For You
                    </p>
                  </div>

                  {/* paper linen grain */}
                  <div
                    className="absolute inset-0 z-[3] opacity-[0.035]"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(0deg, transparent, transparent 1.5px, rgba(0,0,0,0.12) 1.5px, transparent 2.5px), repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, transparent 4px)",
                    }}
                  />

                  {/* warm inner vignette */}
                  <div
                    className="pointer-events-none absolute inset-0 z-[7]"
                    style={{
                      background: "radial-gradient(ellipse at 50% 40%, transparent 50%, rgba(140,100,50,0.06) 100%)",
                    }}
                  />
                </div>

                {/* flap — curved bottom edge with depth */}
                <motion.div
                  className="absolute top-0 right-0 left-0 z-20 rounded-t-xl"
                  style={{
                    height: "56%",
                    clipPath: "polygon(0% 0%, 100% 0%, 50% 100%)",
                    background:
                      "linear-gradient(180deg, #f2e0c4 0%, #e5ceac 50%, #d9c19a 100%)",
                    transformOrigin: "center top",
                    backfaceVisibility: "hidden",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                  }}
                  animate={{
                    rotateX: phase === "opening" ? -175 : 0,
                  }}
                  transition={{
                    duration: 0.85,
                    ease: [0.4, 0, 0.2, 1],
                    delay: phase === "opening" ? 0.2 : 0,
                  }}
                >
                  {/* flap fold crease */}
                  <div
                    className="pointer-events-none absolute bottom-[38%] left-[15%] right-[15%] h-px"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(160,120,70,0.08), transparent)" }}
                  />
                  {/* flap paper grain */}
                  <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(0deg, transparent, transparent 1.5px, rgba(0,0,0,0.1) 1.5px, transparent 2.5px)",
                    }}
                  />
                </motion.div>

                {/* letter peek rising during open */}
                {phase === "opening" && (
                  <motion.div
                    className="absolute z-[15] rounded-t-md"
                    style={{
                      left: "15%",
                      right: "15%",
                      top: "10%",
                      height: "40%",
                      background: "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(245,240,230,0.9) 100%)",
                      boxShadow: "0 -2px 8px rgba(0,0,0,0.08)",
                    }}
                    initial={{ y: 0, opacity: 0 }}
                    animate={{ y: -30, opacity: 1 }}
                    transition={{ duration: 0.7, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {/* faint writing lines on the letter peek */}
                    <div className="flex flex-col gap-[6px] px-4 pt-4">
                      {[0.55, 0.7, 0.5, 0.6].map((w, j) => (
                        <motion.div
                          key={j}
                          className="h-[1.5px] rounded-full bg-rose-300/15"
                          style={{ width: `${w * 100}%` }}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 0.4, delay: 0.7 + j * 0.08 }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* wax seal — ornate */}
                <AnimatePresence>
                  {phase === "sealed" && (
                    <motion.div
                      className="absolute z-30 flex items-center justify-center rounded-full"
                      style={{
                        top: "36%",
                        left: "50%",
                        translate: "-50% -50%",
                        width: 52,
                        height: 52,
                        background:
                          "radial-gradient(circle at 35% 35%, #d43535 0%, #b02020 35%, #8b1a1a 65%, #6b1010 100%)",
                        boxShadow:
                          "0 3px 10px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.15), inset 0 -1px 2px rgba(0,0,0,0.2)",
                      }}
                      exit={{ scale: 0, opacity: 0, rotate: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* outer ring emboss */}
                      <div
                        className="absolute inset-[3px] rounded-full"
                        style={{
                          border: "1px solid rgba(255,200,200,0.12)",
                          boxShadow: "inset 0 0 4px rgba(0,0,0,0.15)",
                        }}
                      />
                      {/* inner ring */}
                      <div
                        className="absolute inset-[7px] rounded-full"
                        style={{
                          border: "0.5px solid rgba(255,200,200,0.08)",
                        }}
                      />

                      {/* hover glow */}
                      <motion.div
                        className="absolute -inset-2 rounded-full"
                        animate={{
                          boxShadow: sealHover
                            ? "0 0 28px 8px rgba(220,110,60,0.5)"
                            : "0 0 12px 2px rgba(180,60,30,0.12)",
                        }}
                        transition={{ duration: 0.35 }}
                      />

                      {/* idle pulsing glow */}
                      <motion.div
                        className="pointer-events-none absolute -inset-1 rounded-full"
                        animate={{
                          boxShadow: [
                            "0 0 8px 2px rgba(200,80,40,0.08)",
                            "0 0 16px 4px rgba(200,80,40,0.18)",
                            "0 0 8px 2px rgba(200,80,40,0.08)",
                          ],
                        }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          ease: "easeInOut" as const,
                        }}
                      />

                      {/* monogram heart */}
                      <span className="relative z-10 select-none text-lg text-amber-300/90"
                            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
                        ♥
                      </span>

                      {/* small wax drip */}
                      <div
                        className="absolute -bottom-[5px] left-[40%] h-[7px] w-[7px] rounded-full"
                        style={{
                          background: "radial-gradient(circle at 40% 30%, #b02020, #7a1515)",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                        }}
                      />
                      <div
                        className="absolute -bottom-[3px] right-[32%] h-[5px] w-[5px] rounded-full"
                        style={{
                          background: "radial-gradient(circle at 40% 30%, #a01c1c, #6b1010)",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* seal fragments on break — more pieces, varied sizes */}
                {phase === "opening" && (
                  <div
                    className="pointer-events-none absolute z-40"
                    style={{
                      top: "36%",
                      left: "50%",
                      translate: "-50% -50%",
                    }}
                  >
                    {Array.from({ length: 12 }).map((_, i) => {
                      const a =
                        (i / 12) * Math.PI * 2 +
                        ((i % 3) - 1) * 0.3;
                      const d = 35 + (i % 4) * 10;
                      return (
                        <motion.div
                          key={i}
                          className="absolute rounded-sm"
                          style={{
                            width: 4 + (i % 4) * 2,
                            height: 3 + (i % 3) * 2,
                            background: `hsl(${2 + i * 2.5}, 60%, ${20 + i * 2.5}%)`,
                            boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                          }}
                          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
                          animate={{
                            x: Math.cos(a) * d,
                            y: Math.sin(a) * d + 8,
                            opacity: 0,
                            rotate: (i - 6) * 40,
                            scale: 0.4,
                          }}
                          transition={{
                            duration: 0.5 + (i % 3) * 0.1,
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
                {/* animated hand icon */}
                <motion.div
                  className="text-sm text-rose-300/20"
                  animate={{
                    y: [0, 3, 0],
                    opacity: [0.15, 0.35, 0.15],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut" as const,
                  }}
                >
                  👆
                </motion.div>
                <motion.p
                  className="text-[0.6rem] tracking-[0.45em] text-rose-300/20 uppercase"
                  animate={{ opacity: [0.12, 0.32, 0.12] }}
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
