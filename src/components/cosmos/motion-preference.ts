/**
 * Choix du visiteur de mettre en pause l'animation du fond, partagé entre
 * le voyage (`WarpField`) et le bouton (`MotionToggle`).
 *
 * Mémorisé dans le navigateur quand c'est possible ; sinon (stockage bloqué,
 * navigation privée), le choix reste valable jusqu'à la fin de la visite.
 */

const STORAGE_KEY = "jonaa-animation-en-pause";
const EVENT = "jonaa:animation-pause";

let memory = false;

export function getPaused(): boolean {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored === "1";
  } catch {
    // Stockage indisponible : on garde la valeur en mémoire.
  }
  return memory;
}

export function setPaused(paused: boolean): void {
  memory = paused;
  try {
    window.localStorage.setItem(STORAGE_KEY, paused ? "1" : "0");
  } catch {
    // Stockage indisponible : la valeur en mémoire suffit pour la visite.
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Abonnement pour `useSyncExternalStore` (y compris depuis un autre onglet). */
export function subscribePaused(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** Le visiteur a-t-il demandé de réduire les animations (réglage du système) ? */
export function getReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION).matches;
}

export function subscribeReducedMotion(onChange: () => void): () => void {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
