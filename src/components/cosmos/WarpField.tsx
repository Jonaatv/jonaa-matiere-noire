"use client";

import { useEffect, useRef } from "react";

import { startWarp } from "./warp";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * Voyage dans l'espace au défilement (voir `warp.ts`).
 *
 * Amélioration progressive : le ciel statique (`StarField`) reste affiché
 * sans JavaScript, pendant le chargement et si le visiteur a demandé de
 * réduire les animations. Le canvas n'apparaît, en fondu, qu'une fois la
 * première image dessinée (`data-warp="on"` sur <html>, voir globals.css).
 */
export function WarpField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const root = document.documentElement;
    const reducedMotion = window.matchMedia(REDUCED_MOTION);
    let stop: (() => void) | null = null;

    const update = () => {
      if (reducedMotion.matches) {
        stop?.();
        stop = null;
        delete root.dataset.warp;
      } else if (!stop) {
        stop = startWarp(canvas, () => {
          root.dataset.warp = "on";
        });
      }
    };

    update();
    // La préférence peut changer pendant la visite.
    reducedMotion.addEventListener("change", update);

    return () => {
      reducedMotion.removeEventListener("change", update);
      stop?.();
      delete root.dataset.warp;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="warp pointer-events-none fixed inset-x-0 top-0 -z-10 h-lvh w-full"
    />
  );
}
