"use client";

import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  /** Profondeur de 0 (lointaine) à 1 (proche) : taille, éclat et vitesse. */
  depth: number;
  radius: number;
  alpha: number;
  twinkleSpeed: number;
  phase: number;
  tinted: boolean;
};

/** Nombre d'étoiles selon la surface de l'écran (moins sur mobile). */
const PIXELS_PER_STAR = 2400;
const MAX_STARS = 420;
/** Vitesse de dérive horizontale, en pixels par seconde, pour une étoile proche. */
const DRIFT_SPEED = 4;

/** Halo lumineux pré-dessiné une seule fois (dégradé radial), réutilisé pour chaque étoile proche. */
function createGlowSprite(): HTMLCanvasElement {
  const size = 64;
  const sprite = document.createElement("canvas");
  sprite.width = sprite.height = size;
  const context = sprite.getContext("2d");
  if (context) {
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgb(196 212 255 / 0.55)");
    gradient.addColorStop(0.35, "rgb(157 184 255 / 0.12)");
    gradient.addColorStop(1, "rgb(157 184 255 / 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  }
  return sprite;
}

function createStars(width: number, height: number): Star[] {
  const count = Math.min(MAX_STARS, Math.round((width * height) / PIXELS_PER_STAR));
  return Array.from({ length: count }, () => {
    const depth = Math.random();
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      depth,
      radius: 0.3 + depth * depth * 1.2,
      alpha: 0.3 + depth * 0.6,
      twinkleSpeed: 0.4 + Math.random() * 1.4,
      phase: Math.random() * Math.PI * 2,
      tinted: Math.random() < 0.3,
    };
  });
}

/**
 * Champ d'étoiles animé (canvas 2D), purement décoratif.
 * - Scintillement et dérive très lente.
 * - Image fixe si le visiteur a activé « réduire les animations ».
 * - Animation suspendue quand l'onglet n'est pas visible.
 */
export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const glow = createGlowSprite();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let stars: Star[] = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let previousTime = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const nextWidth = canvas.clientWidth;
      const nextHeight = canvas.clientHeight;
      canvas.width = Math.round(nextWidth * dpr);
      canvas.height = Math.round(nextHeight * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      // On ne redistribue les étoiles que si la largeur change, pour éviter
      // un « saut » quand la barre d'adresse mobile apparaît ou disparaît.
      if (nextWidth !== width || stars.length === 0) {
        stars = createStars(nextWidth, nextHeight);
      }
      width = nextWidth;
      height = nextHeight;
    };

    const draw = (time: number, animated: boolean) => {
      const elapsed = previousTime ? Math.min(time - previousTime, 100) / 1000 : 0;
      previousTime = time;
      context.clearRect(0, 0, width, height);

      for (const star of stars) {
        if (animated) {
          star.x -= DRIFT_SPEED * (0.15 + star.depth) * elapsed;
          if (star.x < -2) star.x = width + 2;
        }
        const twinkle = animated
          ? 0.6 + 0.4 * Math.sin((time / 1000) * star.twinkleSpeed + star.phase)
          : 0.85;
        context.globalAlpha = star.alpha * twinkle;
        context.fillStyle = star.tinted ? "#c4d4ff" : "#f5f5f7";
        context.beginPath();
        context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        context.fill();

        // Halo discret autour des étoiles les plus proches.
        if (star.radius > 1.1) {
          const size = star.radius * 9;
          context.globalAlpha = star.alpha * twinkle * 0.7;
          context.drawImage(glow, star.x - size / 2, star.y - size / 2, size, size);
        }
      }
      context.globalAlpha = 1;
    };

    const loop = (time: number) => {
      draw(time, true);
      frame = requestAnimationFrame(loop);
    };

    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
    };

    const start = () => {
      stop();
      if (reducedMotion.matches) {
        draw(0, false);
      } else if (!document.hidden) {
        frame = requestAnimationFrame(loop);
      }
    };

    const onResize = () => {
      resize();
      if (reducedMotion.matches || document.hidden) draw(0, false);
    };

    resize();
    start();

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(canvas);
    reducedMotion.addEventListener("change", start);
    document.addEventListener("visibilitychange", start);

    return () => {
      stop();
      resizeObserver.disconnect();
      reducedMotion.removeEventListener("change", start);
      document.removeEventListener("visibilitychange", start);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 size-full" />;
}
