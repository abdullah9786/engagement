"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/context/GameContext";
import { useSound } from "@/hooks/useSound";

const MESSAGE = "Something special is waiting for you\u2026";

interface Mote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  maxLife: number;
  hue: number;
  ambient: boolean;
}

export default function Level1() {
  const { completeLevel } = useGame();
  const { play, haptic } = useSound();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = useRef({ x: -9999, y: -9999 });
  const motes = useRef<Mote[]>([]);
  const phaseRef = useRef("dark");

  const [phase, setPhase] = useState<"dark" | "reveal" | "ready" | "exit">(
    "dark",
  );
  const [charCount, setCharCount] = useState(0);
  const [showTap, setShowTap] = useState(false);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  /* ── phase timing ─────────────────────────────────── */
  useEffect(() => {
    const t = setTimeout(() => setPhase("reveal"), 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== "reveal") return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setCharCount(i);
      if (i >= MESSAGE.length) {
        clearInterval(id);
        setTimeout(() => {
          setPhase("ready");
          setShowTap(true);
        }, 700);
      }
    }, 65);
    return () => clearInterval(id);
  }, [phase]);

  /* ── canvas particle system ───────────────────────── */
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d")!;
    let raf: number;
    let prev = performance.now();

    const resize = () => {
      cvs.width = window.innerWidth;
      cvs.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const pool = motes.current;
    pool.length = 0;

    // seed ambient fireflies
    for (let i = 0; i < 20; i++) {
      pool.push({
        x: Math.random() * cvs.width,
        y: Math.random() * cvs.height,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        r: Math.random() * 1.6 + 0.4,
        life: Infinity,
        maxLife: Infinity,
        hue: 28 + Math.random() * 22,
        ambient: true,
      });
    }

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const elapsed = now - prev;
      if (elapsed < 33) return;
      const dt = Math.min(elapsed, 66) / 16;
      prev = now;
      ctx.clearRect(0, 0, cvs.width, cvs.height);

      const { x: mx, y: my } = pointer.current;
      const hasPointer = mx > -1000;
      const p = phaseRef.current;

      // cursor trail sparks
      if (hasPointer && p !== "dark" && p !== "exit" && Math.random() > 0.5) {
        for (let n = 0; n < 1; n++) {
          pool.push({
            x: mx + (Math.random() - 0.5) * 14,
            y: my + (Math.random() - 0.5) * 14,
            vx: (Math.random() - 0.5) * 0.55,
            vy: -Math.random() * 0.45 - 0.1,
            r: Math.random() * 2 + 0.6,
            life: 65,
            maxLife: 65,
            hue: 30 + Math.random() * 24,
            ambient: false,
          });
        }
      }

      // exit: everything implodes to center
      if (p === "exit") {
        const cx = cvs.width / 2;
        const cy = cvs.height * 0.4;
        for (const m of pool) {
          const dx = cx - m.x;
          const dy = cy - m.y;
          const d = Math.sqrt(dx * dx + dy * dy) || 1;
          m.vx += (dx / d) * 0.45;
          m.vy += (dy / d) * 0.45;
          m.vx *= 0.965;
          m.vy *= 0.965;
        }
      }

      for (let i = pool.length - 1; i >= 0; i--) {
        const m = pool[i];
        m.x += m.vx * dt;
        m.y += m.vy * dt;

        if (!m.ambient) {
          m.life--;
          if (m.life <= 0) {
            pool.splice(i, 1);
            continue;
          }
        }

        // ambient motes react to cursor
        if (m.ambient && hasPointer && p !== "exit") {
          const dx = m.x - mx;
          const dy = m.y - my;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120 && d > 0) {
            m.vx += (dx / d) * 0.018;
            m.vy += (dy / d) * 0.018;
          }
          m.vx *= 0.996;
          m.vy *= 0.996;
          if (m.x < -30) m.x = cvs.width + 30;
          if (m.x > cvs.width + 30) m.x = -30;
          if (m.y < -30) m.y = cvs.height + 30;
          if (m.y > cvs.height + 30) m.y = -30;
        }

        // opacity
        let a: number;
        if (m.ambient) {
          a =
            p === "dark"
              ? 0
              : 0.1 + 0.14 * Math.sin(now * 0.0007 + i * 0.8);
        } else {
          a = 0.7 * (m.life / m.maxLife);
        }

        ctx.globalAlpha = a;
        ctx.fillStyle = `hsl(${m.hue},80%,75%)`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  /* ── handlers ─────────────────────────────────────── */
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    pointer.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onTap = useCallback(() => {
    if (phase !== "ready") return;
    haptic(15);
    play("tap");
    setPhase("exit");
    setShowTap(false);

    // spawn an outward burst then they'll get pulled back in by the exit implosion
    const cvs = canvasRef.current;
    if (cvs) {
      const cx = cvs.width / 2;
      const cy = cvs.height * 0.4;
      for (let i = 0; i < 35; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        motes.current.push({
          x: cx + (Math.random() - 0.5) * 50,
          y: cy + (Math.random() - 0.5) * 50,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          r: Math.random() * 2.5 + 0.8,
          life: 55 + Math.random() * 25,
          maxLife: 80,
          hue: 26 + Math.random() * 32,
          ambient: false,
        });
      }
    }

    setTimeout(() => completeLevel(1), 1400);
  }, [phase, completeLevel]);

  /* ── render ───────────────────────────────────────── */
  const words = MESSAGE.split(" ");

  return (
    <div
      className="relative h-full w-full select-none overflow-hidden"
      onPointerMove={onPointerMove}
      onClick={onTap}
      style={{ cursor: phase === "ready" ? "pointer" : "default" }}
    >
      {/* interactive particle canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0" aria-hidden />

      {/* organic nebula glow — slightly off-center for asymmetry */}
      <motion.div
        className="pointer-events-none absolute z-[1]"
        style={{ top: "37%", left: "53%", translate: "-50% -50%" }}
        initial={{ opacity: 0, scale: 0.3 }}
        animate={
          phase === "exit"
            ? { opacity: 0.9, scale: 8 }
            : phase === "dark"
              ? { opacity: 0, scale: 0.3 }
              : { opacity: 1, scale: 1 }
        }
        transition={
          phase === "exit"
            ? { duration: 1.3, ease: "easeIn" as const }
            : { duration: 3, ease: "easeOut" as const }
        }
      >
        <div
          className="h-64 w-72 rounded-full md:h-80 md:w-96"
          style={{
            background:
              "radial-gradient(ellipse, rgba(212,175,55,0.055) 0%, rgba(180,140,50,0.02) 45%, transparent 70%)",
            filter: "blur(25px)",
          }}
        />
      </motion.div>

      {/* ── content layer ──────────────────────────── */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6">
        <AnimatePresence mode="wait">
          {phase !== "exit" && phase !== "dark" && (
            <motion.div
              key="content"
              className="flex flex-col items-center"
              style={{ marginTop: "-8vh" }}
              exit={{
                opacity: 0,
                scale: 0.8,
                transition: { duration: 0.8 },
              }}
            >
              {/* hand-drawn decorative arc */}
              <motion.svg
                width="160"
                height="32"
                viewBox="0 0 160 32"
                className="mb-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.22 }}
                transition={{ duration: 2.5, delay: 0.2 }}
              >
                <motion.path
                  d="M 6 28 C 40 4, 120 4, 154 28"
                  fill="none"
                  stroke="rgba(212,175,55,0.5)"
                  strokeWidth="0.7"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{
                    duration: 2.5,
                    delay: 0.2,
                    ease: "easeOut" as const,
                  }}
                />
                {/* tiny diamond at the apex */}
                <motion.path
                  d="M 78 5 L 80 2 L 82 5 L 80 8 Z"
                  fill="rgba(212,175,55,0.35)"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 1.5 }}
                />
              </motion.svg>

              {/* main message — char-by-char materialisation, grouped by word */}
              <p className=" text-center font-serif text-[1.55rem] leading-[1.7]  sm:text-3xl md:text-[2.1rem] md:leading-[1.65]">
                {words.map((word, wi) => {
                  const charOffset = words
                    .slice(0, wi)
                    .reduce((sum, w) => sum + w.length + 1, 0);
                  return (
                    <span key={wi} className="inline-block whitespace-nowrap">
                      {word.split("").map((char, ci) => {
                        const gi = charOffset + ci;
                        return (
                          <motion.span
                            key={gi}
                            className="inline-block"
                            style={{
                              textShadow:
                                gi < charCount
                                  ? "0 0 28px rgba(212,175,55,0.22), 0 0 56px rgba(212,175,55,0.06)"
                                  : "none",
                            }}
                            initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
                            animate={
                              gi < charCount
                                ? {
                                    opacity: 1,
                                    y: 0,
                                    filter: "blur(0px)",
                                    color: "rgba(255,240,195,0.92)",
                                  }
                                : {}
                            }
                            transition={{
                              duration: 0.32,
                              ease: "easeOut" as const,
                            }}
                          >
                            {char}
                          </motion.span>
                        );
                      })}
                      {wi < words.length - 1 && (
                        <span className="inline-block w-[0.28em]">&nbsp;</span>
                      )}
                    </span>
                  );
                })}
              </p>

              {/* thin gradient divider */}
              <motion.div
                className="mt-10 h-px origin-center bg-gradient-to-r from-transparent via-amber-400/20 to-transparent"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{
                  duration: 1.6,
                  delay: MESSAGE.length * 0.05 + 0.4,
                  ease: "easeOut" as const,
                }}
                style={{ width: 200 }}
              />

              {/* ── tap to begin orb ─────────────── */}
              <AnimatePresence>
                {showTap && (
                  <motion.div
                    className="mt-16 flex flex-col items-center gap-5"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.9 }}
                  >
                    <div className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center">
                      {/* expanding ripple 1 */}
                      <motion.div
                        className="absolute inset-0 rounded-full border border-amber-400/[0.12]"
                        animate={{ scale: [1, 2], opacity: [0.35, 0] }}
                        transition={{
                          duration: 2.8,
                          repeat: Infinity,
                          ease: "easeOut" as const,
                        }}
                      />
                      {/* expanding ripple 2 — offset timing */}
                      <motion.div
                        className="absolute inset-0 rounded-full border border-amber-400/[0.08]"
                        animate={{ scale: [1, 2.5], opacity: [0.25, 0] }}
                        transition={{
                          duration: 2.8,
                          repeat: Infinity,
                          ease: "easeOut" as const,
                          delay: 0.9,
                        }}
                      />
                      {/* breathing ring */}
                      <motion.div
                        className="absolute inset-1 rounded-full border border-amber-400/20"
                        animate={{ scale: [0.92, 1.08, 0.92] }}
                        transition={{
                          duration: 3.2,
                          repeat: Infinity,
                          ease: "easeInOut" as const,
                        }}
                      />
                      {/* glowing core */}
                      <motion.div
                        className="h-3 w-3 rounded-full bg-amber-300/60"
                        animate={{
                          scale: [1, 1.4, 1],
                          opacity: [0.45, 0.95, 0.45],
                        }}
                        transition={{
                          duration: 2.6,
                          repeat: Infinity,
                          ease: "easeInOut" as const,
                        }}
                      />
                    </div>

                    <motion.p
                      className="text-[0.65rem] tracking-[0.45em] text-amber-300/20 uppercase"
                      animate={{ opacity: [0.12, 0.38, 0.12] }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut" as const,
                      }}
                    >
                      tap to begin
                    </motion.p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* radial flash on exit */}
        <AnimatePresence>
          {phase === "exit" && (
            <motion.div
              className="fixed inset-0 z-50 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 50% 40%, rgba(255,250,225,0.95) 0%, rgba(255,250,225,0) 65%)",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.9, 0] }}
              transition={{ duration: 1.4, times: [0, 0.3, 1] }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
