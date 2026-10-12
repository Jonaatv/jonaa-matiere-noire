"use client";

import { useSyncExternalStore } from "react";

import {
  getPaused,
  getReducedMotion,
  setPaused,
  subscribePaused,
  subscribeReducedMotion,
} from "./motion-preference";

const noop = () => () => {};

/**
 * Bouton pour mettre en pause et reprendre l'animation du fond
 * (WCAG 2.2.2 : tout mouvement automatique de plus de 5 s doit pouvoir être arrêté).
 *
 * Bouton bascule : libellé constant et état annoncé par `aria-pressed`.
 * Absent sans JavaScript (il n'y aurait rien à arrêter) et quand le visiteur
 * a demandé de réduire les animations (le fond est alors déjà immobile).
 */
export function MotionToggle() {
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);
  const paused = useSyncExternalStore(subscribePaused, getPaused, () => false);

  if (!hydrated || reducedMotion) return null;

  return (
    <button
      type="button"
      aria-pressed={paused}
      aria-label="Mettre en pause l’animation du fond"
      title={paused ? "Reprendre l’animation du fond" : "Mettre en pause l’animation du fond"}
      onClick={() => setPaused(!paused)}
      className="fixed right-4 bottom-4 z-40 inline-flex size-11 items-center justify-center rounded-full border border-star/25 bg-void/70 text-star/80 transition-colors hover:border-glow hover:text-glow sm:right-6 sm:bottom-6"
    >
      {paused ? (
        // Lecture : triangle.
        <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" className="size-4" fill="currentColor">
          <path d="M5 3.5v9l7.5-4.5z" />
        </svg>
      ) : (
        // Pause : deux barres.
        <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" className="size-4" fill="currentColor">
          <rect x="4" y="3.5" width="2.5" height="9" rx="0.5" />
          <rect x="9.5" y="3.5" width="2.5" height="9" rx="0.5" />
        </svg>
      )}
    </button>
  );
}
