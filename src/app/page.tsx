"use client";

import { GameProvider } from "@/context/GameContext";
import GameShell from "@/components/GameShell";

export default function Home() {
  return (
    <GameProvider>
      <GameShell />
    </GameProvider>
  );
}
