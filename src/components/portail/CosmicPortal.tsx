"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

import {
  getPaused,
  getReducedMotion,
  subscribePaused,
  subscribeReducedMotion,
} from "@/components/cosmos/motion-preference";

import { PORTAL_RATIO, startPortal, type PortalController } from "./portal-engine";

/** Pas d'exploration au clavier, en part de la scène. */
const KEY_STEP = 0.06;
const KEY_MOVES: Record<string, [number, number]> = {
  ArrowLeft: [-KEY_STEP, 0],
  ArrowRight: [KEY_STEP, 0],
  ArrowUp: [0, -KEY_STEP],
  ArrowDown: [0, KEY_STEP],
};

/**
 * Portail cosmique : scène interactive plein écran (voir `portal-engine.ts`).
 *
 * Doigt et souris : toucher le portail déclenche une onde lumineuse ; glisser
 * attire les particules et déplace la perspective ; au relâchement, l'univers
 * revient doucement à son état naturel. Les gestes sur la scène ne font ni
 * défiler ni naviguer (`touch-action: none`).
 * Clavier : le portail est un bouton (Entrée ou Espace : onde lumineuse ;
 * flèches : explorer ; Échap : retour au calme).
 * Réduction des animations ou pause demandée avec le bouton du site : plus de
 * mouvement continu, seules les réactions lumineuses restent.
 */
export function CosmicPortal() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<PortalController | null>(null);
  const [ready, setReady] = useState(false);
  const [explored, setExplored] = useState(false);

  const paused = useSyncExternalStore(subscribePaused, getPaused, () => false);
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);
  const calm = paused || reducedMotion;
  const calmRef = useRef(calm);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const controller = startPortal(canvas, {
      calm: calmRef.current,
      onReady: () => setReady(true),
    });
    controllerRef.current = controller;

    // Rien n'est dessiné quand la scène n'est pas visible (onglet masqué, page défilée).
    let onScreen = true;
    const updateVisibility = () => controller.setVisible(onScreen && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      updateVisibility();
    });
    observer.observe(canvas);
    document.addEventListener("visibilitychange", updateVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", updateVisibility);
      controller.destroy();
      controllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    calmRef.current = calm;
    controllerRef.current?.setCalm(calm);
  }, [calm]);

  const local = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top] as const;
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    // Le doigt reste « attaché » à la scène même s'il en sort pendant le geste.
    event.currentTarget.setPointerCapture(event.pointerId);
    controllerRef.current?.pointerDown(...local(event));
    setExplored(true);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    // Au toucher, seul le doigt posé compte ; à la souris, le survol suffit.
    if (event.pointerType !== "mouse" && event.buttons === 0) return;
    controllerRef.current?.pointerMove(...local(event), event.buttons !== 0);
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const [x, y] = local(event);
    controllerRef.current?.pointerUp(x, y);
    if (event.pointerType !== "mouse") controllerRef.current?.release();
  };

  const onPointerLeave = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse") controllerRef.current?.release();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const move = KEY_MOVES[event.key];
    if (move) {
      event.preventDefault();
      controllerRef.current?.explore(...move);
      setExplored(true);
    } else if (event.key === "Escape") {
      controllerRef.current?.release();
    }
  };

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => controllerRef.current?.release()}
      onPointerLeave={onPointerLeave}
      onContextMenu={(event) => event.preventDefault()}
      className="portail-scene relative h-full w-full touch-none overflow-hidden select-none [container-type:size] [-webkit-touch-callout:none]"
    >
      {/* Bords haut et bas fondus dans le noir : le halo ne s'arrête jamais net. */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 size-full [mask-image:linear-gradient(to_bottom,transparent,#000_14%,#000_86%,transparent)]"
      />

      {/* Le portail au clavier : un bouton à son emplacement (les gestes passent au travers). */}
      <button
        type="button"
        aria-label="Toucher le portail"
        aria-describedby="portail-consignes"
        onClick={() => {
          controllerRef.current?.pulse();
          setExplored(true);
        }}
        onKeyDown={onKeyDown}
        onBlur={() => controllerRef.current?.release()}
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline-offset-8"
        style={{ width: `${PORTAL_RATIO * 200}cqmin`, height: `${PORTAL_RATIO * 200}cqmin` }}
      />
      <p id="portail-consignes" className="sr-only">
        Un anneau de lumière bleue suspendu dans le noir, entouré de particules en orbite.
        Flèches : explorer l’espace. Entrée ou Espace : faire réagir le portail. Échap : laisser
        l’univers revenir au calme.
      </p>

      {/* Invitation discrète, qui s'efface dès la première exploration. */}
      <p
        aria-hidden="true"
        data-visible={ready && !explored ? "" : undefined}
        className="pointer-events-none absolute inset-x-0 bottom-6 px-6 text-center text-xs tracking-[0.3em] text-star/70 uppercase opacity-0 transition-opacity duration-1000 data-visible:opacity-100"
      >
        <span className="pointer-fine:hidden">Touchez · glissez · explorez</span>
        <span className="hidden pointer-fine:inline">Cliquez · déplacez la souris · explorez</span>
      </p>
    </div>
  );
}
