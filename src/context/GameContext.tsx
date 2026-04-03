"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface GameState {
  unlockedLevel: number;
  currentLevel: number;
  completeLevel: (level: number) => void;
  goToLevel: (level: number) => void;
}

const GameContext = createContext<GameState | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [currentLevel, setCurrentLevel] = useState(1);

  const completeLevel = useCallback(
    (level: number) => {
      if (level === unlockedLevel) {
        const next = level + 1;
        setUnlockedLevel(next);
        setTimeout(() => setCurrentLevel(next), 600);
      }
    },
    [unlockedLevel],
  );

  const goToLevel = useCallback(
    (level: number) => {
      if (level <= unlockedLevel) setCurrentLevel(level);
    },
    [unlockedLevel],
  );

  return (
    <GameContext.Provider
      value={{ unlockedLevel, currentLevel, completeLevel, goToLevel }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
