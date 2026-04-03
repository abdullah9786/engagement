"use client";

import { useCallback } from "react";

type SoundName =
  | "tap"
  | "success"
  | "whoosh"
  | "reveal"
  | "shatter"
  | "heartbeat"
  | "celebrate";

const PATHS: Record<SoundName, string> = {
  tap: "/sounds/tap.mp3",
  success: "/sounds/success.mp3",
  whoosh: "/sounds/whoosh.mp3",
  reveal: "/sounds/reveal.mp3",
  shatter: "/sounds/shatter.mp3",
  heartbeat: "/sounds/heartbeat.mp3",
  celebrate: "/sounds/celebrate.mp3",
};

const VOLUME: Partial<Record<SoundName, number>> = {
  heartbeat: 0.15,
  tap: 0.25,
  whoosh: 0.3,
};

/**
 * Drop .mp3 files matching the names in /public/sounds/ to activate.
 * Without the files the calls are harmless no-ops.
 */
export function useSound() {
  const play = useCallback((name: SoundName) => {
    if (typeof window === "undefined") return;
    try {
      const a = new Audio(PATHS[name]);
      a.volume = VOLUME[name] ?? 0.35;
      a.play().catch(() => {});
    } catch {
      /* no file — silent fallback */
    }
  }, []);

  const haptic = useCallback((pattern: number | number[] = 10) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        /* unsupported — silent */
      }
    }
  }, []);

  return { play, haptic };
}
