"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";

import { PlaceholderPill } from "@/components/ui/Placeholder";
import {
  comingSoonMessage,
  constellationLinks,
  constellationStars,
  type ConstellationStar,
} from "@/config/constellation";

const PANEL_ID = "panneau-constellation";

/** Poussière d'étoiles décorative : positions fixes (graine), identiques à chaque rendu. */
const DUST_COUNT = 70;
const DUST_SEED = 20261012;

function createRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (value: number) => Math.round(value * 100) / 100;

const dust = (() => {
  const random = createRandom(DUST_SEED);
  return Array.from({ length: DUST_COUNT }, () => {
    const size = random();
    return {
      x: round(random() * 100),
      y: round(random() * 100),
      r: round(0.12 + size * size * 0.22),
      opacity: round(0.12 + random() * 0.4),
    };
  });
})();

const starsById = new Map(constellationStars.map((star) => [star.id, star]));

/** Écart (en % du ciel) laissé entre une ligne et l'étoile, comme sur une carte du ciel. */
const LINK_GAP = 3.2;

/** Extrémités d'une ligne, raccourcie aux deux bouts pour ne pas toucher les étoiles. */
function shorten(a: ConstellationStar, b: ConstellationStar): [number, number, number, number] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const ratio = LINK_GAP / Math.hypot(dx, dy);
  return [
    round(a.x + dx * ratio),
    round(a.y + dy * ratio),
    round(b.x - dx * ratio),
    round(b.y - dy * ratio),
  ];
}

/** Nom accessible d'une étoile : le titre officiel s'il existe, sinon l'identifiant provisoire. */
const starName = (star: ConstellationStar) => star.title ?? `Étoile ${star.code}`;

/**
 * Constellation interactive : le ciel (lignes + étoiles sélectionnables) et
 * le panneau de l'étoile choisie. Rendu en deux blocs frères pour que la page
 * les place librement dans sa grille (panneau sous le ciel sur mobile, à côté
 * sur ordinateur).
 *
 * Souris et toucher : une étoile se sélectionne d'un appui ; un nouvel appui,
 * un appui dans le vide ou « Fermer » la désélectionne.
 * Clavier : Tab ou flèches pour parcourir, Entrée ou Espace pour ouvrir,
 * Échap pour refermer (le focus revient sur l'étoile).
 */
export function Constellation() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const buttonsRef = useRef(new Map<string, HTMLButtonElement>());
  const panelRef = useRef<HTMLDivElement>(null);
  const selected = selectedId ? (starsById.get(selectedId) ?? null) : null;

  const close = (returnFocus: boolean) => {
    if (returnFocus && selectedId) buttonsRef.current.get(selectedId)?.focus();
    setSelectedId(null);
  };

  // Échap referme le panneau, où que soit le focus.
  useEffect(() => {
    if (!selectedId) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      buttonsRef.current.get(selectedId)?.focus();
      setSelectedId(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selectedId]);

  // Petits écrans : le panneau est sous le ciel, on l'amène dans la vue.
  useEffect(() => {
    const panel = panelRef.current;
    if (!selectedId || !panel) return;
    const { top, bottom } = panel.getBoundingClientRect();
    if (bottom <= window.innerHeight && top >= 0) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    panel.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
  }, [selectedId]);

  const toggle = (id: string) => setSelectedId((current) => (current === id ? null : id));

  // Flèches, Début et Fin : passer d'une étoile à l'autre dans l'ordre de la constellation.
  const onStarKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = constellationStars.length - 1;
    const target = {
      ArrowRight: index + 1,
      ArrowDown: index + 1,
      ArrowLeft: index - 1,
      ArrowUp: index - 1,
      Home: 0,
      End: last,
    }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    const next = constellationStars[(target + last + 1) % (last + 1)];
    buttonsRef.current.get(next.id)?.focus();
  };

  // Un appui dans le vide (hors étoile) désélectionne.
  const onSkyClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!(event.target as HTMLElement).closest("button")) setSelectedId(null);
  };

  return (
    <>
      <div className="w-full lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1">
        <div
          onClick={onSkyClick}
          className="ciel-constellation relative mx-auto aspect-square w-full max-w-[min(100%,calc(100svh-8rem))] touch-manipulation"
        >
          <div className="constellation-derive absolute inset-0">
            <svg
              aria-hidden="true"
              focusable="false"
              viewBox="0 0 100 100"
              className="absolute inset-0 size-full overflow-visible"
            >
              {dust.map((grain, index) => (
                <circle
                  key={index}
                  cx={grain.x}
                  cy={grain.y}
                  r={grain.r}
                  fill="var(--color-star)"
                  opacity={grain.opacity}
                />
              ))}
              {constellationLinks.map(([from, to], index) => {
                const a = starsById.get(from);
                const b = starsById.get(to);
                if (!a || !b) return null;
                const [x1, y1, x2, y2] = shorten(a, b);
                const active = selectedId === from || selectedId === to;
                return (
                  <line
                    key={`${from}-${to}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    vectorEffect="non-scaling-stroke"
                    data-actif={active ? "" : undefined}
                    className="trait-constellation"
                    style={{ animationDelay: `${0.4 + index * 0.22}s` }}
                  />
                );
              })}
            </svg>

            <ul aria-label="Étoiles de la constellation">
              {constellationStars.map((star, index) => {
                const isSelected = star.id === selectedId;
                return (
                  <li
                    key={star.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${star.x}%`, top: `${star.y}%` }}
                  >
                    <button
                      ref={(node) => {
                        if (node) buttonsRef.current.set(star.id, node);
                        else buttonsRef.current.delete(star.id);
                      }}
                      type="button"
                      aria-pressed={isSelected}
                      aria-controls={PANEL_ID}
                      aria-label={starName(star)}
                      onClick={() => toggle(star.id)}
                      onKeyDown={(event) => onStarKeyDown(event, index)}
                      data-eclat={star.magnitude}
                      className="etoile-constellation group relative flex size-11 items-center justify-center rounded-full"
                      style={{ animationDelay: `-${(index * 1.7) % 9}s` }}
                    >
                      <span aria-hidden="true" className="etoile-halo" />
                      <span aria-hidden="true" className="etoile-anneau" />
                      <span aria-hidden="true" className="etoile-coeur" />
                    </button>
                    {isSelected ? (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 text-[0.6875rem] tracking-[0.3em] whitespace-nowrap text-glow"
                      >
                        {star.code}
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      <div
        ref={panelRef}
        id={PANEL_ID}
        aria-live="polite"
        className="scroll-mb-20 lg:col-span-4 lg:row-start-2 lg:self-start"
      >
        {selected ? (
          <StarPanel key={selected.id} star={selected} onClose={() => close(true)} />
        ) : (
          <div className="flex flex-col gap-2 border-l border-cosmic/60 py-1 pl-5 text-[0.9375rem] leading-relaxed text-star/70">
            <p>Sélectionnez une étoile pour l’approcher.</p>
            <p className="hidden text-xs leading-relaxed tracking-[0.06em] text-star/60 pointer-fine:block">
              Au clavier : Tab ou flèches pour parcourir, Entrée pour ouvrir, Échap pour refermer.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

/** Panneau d'une étoile : contenu officiel s'il existe, sinon identifiant provisoire et message d'attente. */
function StarPanel({ star, onClose }: { star: ConstellationStar; onClose: () => void }) {
  const headingId = `${star.id}-titre`;
  const pending = !star.title && !star.text && !star.visual;

  return (
    <section
      aria-labelledby={headingId}
      className="revele relative flex flex-col gap-5 border-l border-glow/50 bg-linear-to-r from-night/80 via-night/40 to-transparent py-6 pr-4 pl-6 sm:pl-8"
    >
      <p className="text-xs tracking-[0.36em] text-glow uppercase">
        {star.title ? star.code : "Identifiant provisoire"}
      </p>
      <h2 id={headingId} className="font-display text-[2.75rem] leading-none font-light sm:text-5xl">
        {star.title ?? star.code}
      </h2>
      {star.visual ? (
        // eslint-disable-next-line @next/next/no-img-element -- export statique : image servie telle quelle.
        <img
          src={star.visual.src}
          alt={star.visual.alt}
          width={star.visual.width}
          height={star.visual.height}
          loading="lazy"
          decoding="async"
          className="h-auto w-full max-w-xs"
        />
      ) : null}
      <p className="max-w-sm text-base leading-relaxed text-star/80">{star.text ?? comingSoonMessage}</p>
      {pending ? <PlaceholderPill label="contenu officiel" className="self-start" /> : null}
      <button
        type="button"
        onClick={onClose}
        className="inline-flex min-h-11 items-center gap-3 self-start rounded-full border border-star/30 px-5 text-xs font-medium tracking-[0.2em] uppercase transition-colors hover:border-glow hover:text-glow"
      >
        <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" className="size-3" fill="none">
          <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Fermer
      </button>
    </section>
  );
}
