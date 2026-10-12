"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";

import { getPaused, subscribePaused } from "./motion-preference";
import { startWarp, type WarpController } from "./warp";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * Vitesse de croisière de l'accueil (unités de profondeur par seconde) :
 * une étoile lointaine met une dizaine de secondes à arriver jusqu'à nous.
 * Les autres pages gardent un ciel qui ne bouge qu'au défilement.
 */
const HOME_CRUISE = 0.09;

/**
 * Mise en veille pour ménager la batterie : sans aucune interaction pendant
 * ce délai, la croisière ralentit doucement jusqu'à l'arrêt (et la dérive de
 * la nébuleuse se met en pause). Elle repart au moindre geste.
 */
const IDLE_DELAY_MS = 60_000;
const ACTIVITY_EVENTS = ["pointermove", "pointerdown", "keydown", "scroll", "touchstart", "wheel"] as const;

/**
 * Démarrage différé : le voyage ne commence qu'une fois la page chargée et
 * le navigateur disponible, pour ne pas retarder l'affichage du titre et de
 * la pochette (le ciel statique est visible en attendant).
 */
const START_TIMEOUT_MS = 1500;

function whenIdle(callback: () => void): () => void {
  let handle = 0;
  let idle = 0;
  const run = () => {
    // requestIdleCallback n'existe pas partout (Safari) : repli sur un court délai.
    if (typeof window.requestIdleCallback === "function") {
      idle = window.requestIdleCallback(callback, { timeout: START_TIMEOUT_MS });
    } else {
      handle = window.setTimeout(callback, 200);
    }
  };
  if (document.readyState === "complete") run();
  else window.addEventListener("load", run, { once: true });
  return () => {
    window.removeEventListener("load", run);
    window.clearTimeout(handle);
    if (idle) window.cancelIdleCallback(idle);
  };
}

/**
 * Voyage dans l'espace (voir `warp.ts`).
 *
 * Amélioration progressive : le ciel statique (`StarField`) reste affiché
 * sans JavaScript, pendant le chargement et si le visiteur a demandé de
 * réduire les animations. Le canvas n'apparaît, en fondu, qu'une fois la
 * première image dessinée (`data-warp="on"` sur <html>, voir globals.css).
 * Le visiteur peut aussi mettre l'animation en pause (`MotionToggle`).
 */
export function WarpField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<WarpController | null>(null);
  const pathname = usePathname();
  const cruise = pathname === "/" ? HOME_CRUISE : 0;
  const cruiseRef = useRef(cruise);
  const paused = useSyncExternalStore(subscribePaused, getPaused, () => false);
  const pausedRef = useRef(paused);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const root = document.documentElement;
    const reducedMotion = window.matchMedia(REDUCED_MOTION);

    const update = () => {
      if (reducedMotion.matches) {
        controllerRef.current?.stop();
        controllerRef.current = null;
        delete root.dataset.warp;
      } else if (!controllerRef.current) {
        controllerRef.current = startWarp(canvas, () => {
          root.dataset.warp = "on";
        });
        controllerRef.current.setPaused(pausedRef.current);
        controllerRef.current.setCruise(cruiseRef.current);
      }
    };

    const cancelStart = whenIdle(update);
    // La préférence peut changer pendant la visite.
    reducedMotion.addEventListener("change", update);

    return () => {
      cancelStart();
      reducedMotion.removeEventListener("change", update);
      controllerRef.current?.stop();
      controllerRef.current = null;
      delete root.dataset.warp;
    };
  }, []);

  // Pause demandée par le visiteur : le canvas se fige, la nébuleuse et les
  // scintillements s'arrêtent (`data-pause` sur <html>, voir globals.css).
  useEffect(() => {
    const root = document.documentElement;
    pausedRef.current = paused;
    controllerRef.current?.setPaused(paused);
    if (paused) root.dataset.pause = "";
    else delete root.dataset.pause;
  }, [paused]);

  // Croisière selon la page (y compris lors d'une navigation sans
  // rechargement), avec mise en veille après une période sans interaction.
  useEffect(() => {
    const root = document.documentElement;
    cruiseRef.current = cruise;
    controllerRef.current?.setCruise(cruise);
    if (cruise === 0) return;

    let timer = 0;
    let asleep = false;
    const sleep = () => {
      asleep = true;
      root.dataset.veille = "";
      cruiseRef.current = 0;
      controllerRef.current?.setCruise(0);
    };
    const wake = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(sleep, IDLE_DELAY_MS);
      if (!asleep) return;
      asleep = false;
      delete root.dataset.veille;
      cruiseRef.current = cruise;
      controllerRef.current?.setCruise(cruise);
    };

    wake();
    for (const type of ACTIVITY_EVENTS) window.addEventListener(type, wake, { passive: true });
    return () => {
      window.clearTimeout(timer);
      for (const type of ACTIVITY_EVENTS) window.removeEventListener(type, wake);
      delete root.dataset.veille;
    };
  }, [cruise]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="warp pointer-events-none fixed inset-x-0 top-0 -z-10 h-lvh w-full"
    />
  );
}
