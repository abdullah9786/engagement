"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "@/context/GameContext";
import Particles from "./Particles";
import Level1 from "./levels/Level1";
import Level2 from "./levels/Level2";
import Level3 from "./levels/Level3";
import Level4 from "./levels/Level4";
import Level5 from "./levels/Level5";
import Level6 from "./levels/Level6";

interface LevelDef {
  component: React.FC;
  particle: string;
  ownParticles?: boolean;
}

const LEVELS: Record<number, LevelDef> = {
  1: { component: Level1, particle: "", ownParticles: true },
  2: { component: Level2, particle: "rgba(167, 139, 250, 0.4)" },
  3: { component: Level3, particle: "rgba(212, 175, 55, 0.3)" },
  4: { component: Level4, particle: "", ownParticles: true },
  5: { component: Level5, particle: "rgba(212, 175, 55, 0.35)" },
  6: { component: Level6, particle: "rgba(245, 158, 11, 0.5)" },
};

const TOTAL_LEVELS = Object.keys(LEVELS).length;

/*
 * Per-level transition choreography.
 * Each level gets a thematically appropriate enter / exit so transitions
 * feel narrative rather than repetitive.
 */
interface TransDef {
  initial: Record<string, number | string>;
  exit: Record<string, number | string>;
  duration: number;
}

const TRANS: Record<number, TransDef> = {
  1: {
    initial: { opacity: 0 },
    exit: { opacity: 0, scale: 0.88, filter: "blur(14px)" },
    duration: 0.7,
  },
  2: {
    initial: { opacity: 0, x: 60, filter: "blur(4px)" },
    exit: { opacity: 0, x: -60, filter: "blur(4px)" },
    duration: 0.6,
  },
  3: {
    initial: { opacity: 0, y: 50, filter: "blur(3px)" },
    exit: { opacity: 0, y: -35, scale: 0.97 },
    duration: 0.65,
  },
  4: {
    initial: { opacity: 0, scale: 1.15, filter: "blur(16px)" },
    exit: { opacity: 0, scale: 0.94, filter: "blur(6px)" },
    duration: 0.75,
  },
  5: {
    initial: { opacity: 0, scale: 0.96, filter: "blur(5px)" },
    exit: { opacity: 0, scale: 1.08, filter: "blur(10px)" },
    duration: 0.65,
  },
  6: {
    initial: { opacity: 0, scale: 0.85, filter: "blur(10px)" },
    exit: { opacity: 0 },
    duration: 0.85,
  },
};

const ENTER_EASE = [0.22, 1, 0.36, 1] as const;
const EXIT_EASE = [0.55, 0, 1, 0.45] as const;

export default function GameShell() {
  const { currentLevel, unlockedLevel } = useGame();
  const level = LEVELS[currentLevel];
  if (!level) return null;

  const LevelComponent = level.component;
  const t = TRANS[currentLevel] ?? TRANS[1];

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#07070f]">
      {!level.ownParticles && (
        <Particles
          key={`p-${currentLevel}`}
          color={level.particle}
          count={50}
        />
      )}

      {/* Progress dots — visible during puzzle levels 2-3 only */}
      <AnimatePresence>
        {currentLevel > 1 && currentLevel < 4 && (
          <motion.div
            className="fixed top-6 left-1/2 z-50 flex -translate-x-1/2 gap-2.5"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.45, ease: ENTER_EASE }}
          >
            {Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1).map(
              (n) => (
                <motion.div
                  key={n}
                  className={`h-[5px] rounded-full ${
                    n === currentLevel
                      ? "w-7 bg-amber-400 shadow-[0_0_8px_rgba(212,175,55,0.3)]"
                      : n < unlockedLevel
                        ? "w-[5px] bg-amber-400/40"
                        : n === unlockedLevel
                          ? "w-[5px] bg-amber-400/20"
                          : "w-[5px] bg-white/[0.06]"
                  }`}
                  layout
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              ),
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentLevel}
          className="h-full w-full"
          initial={t.initial}
          animate={{
            opacity: 1,
            scale: 1,
            x: 0,
            y: 0,
            filter: "blur(0px)",
          }}
          exit={{
            ...t.exit,
            transition: {
              duration: t.duration * 0.65,
              ease: EXIT_EASE,
            },
          }}
          transition={{
            duration: t.duration,
            ease: ENTER_EASE,
          }}
        >
          <LevelComponent />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
