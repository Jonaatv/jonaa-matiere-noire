import Link from "next/link";
import type { ReactNode } from "react";

import { constellationLinks, constellationStars } from "@/config/constellation";

/**
 * Accueil — « Explore l'univers » : accès aux deux expériences interactives
 * (Constellation et Portail cosmique). Les illustrations sont de simples
 * aperçus fixes en SVG, dessinés au build : aucune image chargée, aucun
 * script, aucune animation continue.
 */
export function ExploreSection() {
  return (
    <section
      id="explorer"
      aria-labelledby="titre-explorer"
      className="flex flex-col gap-10 border-t border-cosmic/45 px-5 py-20 sm:px-10 lg:gap-14 lg:px-24 lg:py-30"
    >
      <header className="flex flex-col gap-6">
        <p className="text-xs tracking-[0.38em] text-glow uppercase">Expériences</p>
        <h2
          id="titre-explorer"
          className="font-display text-[3.25rem] leading-[0.95] font-light lg:text-7xl"
        >
          Explore l’univers
        </h2>
      </header>

      <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-10">
        <ExperienceCard
          href="/constellation"
          title="La Constellation"
          description="Une carte d’étoiles à parcourir, du doigt, à la souris ou au clavier."
          illustration={<ConstellationPreview />}
        />
        <ExperienceCard
          href="/portail"
          title="Le Portail cosmique"
          description="Un passage lumineux suspendu dans le noir, qui réagit au toucher."
          illustration={<PortalPreview />}
        />
      </ul>
    </section>
  );
}

function ExperienceCard({
  href,
  title,
  description,
  illustration,
}: {
  href: string;
  title: string;
  description: string;
  illustration: ReactNode;
}) {
  return (
    <li>
      {/* Toute la carte est le lien : une seule cible, grande, au doigt comme au clavier. */}
      <Link
        href={href}
        className="group flex h-full flex-col overflow-hidden rounded-sm border border-cosmic/60 bg-night/50 transition-colors hover:border-glow/60"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-void">
          <div className="absolute inset-0 transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.03]">
            {illustration}
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-3 border-t border-cosmic/45 p-6 sm:p-8">
          <h3 className="font-display text-[2rem] leading-tight font-light sm:text-4xl">{title}</h3>
          <p className="max-w-sm text-[0.9375rem] leading-relaxed text-star/75">{description}</p>
          <span className="mt-auto inline-flex items-center gap-3 pt-3 text-xs font-medium tracking-[0.2em] text-glow uppercase">
            Explorer
            <span
              aria-hidden="true"
              className="transition-transform duration-500 motion-safe:group-hover:translate-x-1"
            >
              →
            </span>
          </span>
        </div>
      </Link>
    </li>
  );
}

/** Générateur pseudo-aléatoire déterministe (mulberry32) : même dessin à chaque build. */
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

/** Poussière d'étoiles de fond, en coordonnées 0–120 × 0–90 (format 4:3). */
function dust(seed: number, count: number) {
  const random = createRandom(seed);
  return Array.from({ length: count }, () => ({
    x: round(random() * 120),
    y: round(random() * 90),
    r: round(0.12 + random() ** 2 * 0.25),
    opacity: round(0.15 + random() * 0.45),
  }));
}

const constellationDust = dust(20261013, 60);
const portalDust = dust(20261014, 70);

/** Aperçu de la constellation : les vraies étoiles et lignes de la page, en miniature. */
function ConstellationPreview() {
  const byId = new Map(constellationStars.map((star) => [star.id, star]));
  // Étoiles placées dans un carré de 80 centré dans le cadre 120 × 90.
  const at = (value: number, offset: number) => round(offset + value * 0.8);

  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 120 90" className="size-full">
      <defs>
        <radialGradient id="apercu-constellation-halo" cx="0.55" cy="0.5" r="0.6">
          <stop offset="0" stopColor="#253b85" stopOpacity="0.55" />
          <stop offset="1" stopColor="#253b85" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="apercu-constellation-etoile">
          <stop offset="0" stopColor="#f5f5f7" />
          <stop offset="0.35" stopColor="#9db8ff" stopOpacity="0.45" />
          <stop offset="1" stopColor="#9db8ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="120" height="90" fill="url(#apercu-constellation-halo)" />
      {constellationDust.map((grain, index) => (
        <circle key={index} cx={grain.x} cy={grain.y} r={grain.r} fill="#f5f5f7" opacity={grain.opacity} />
      ))}
      {constellationLinks.map(([from, to]) => {
        const a = byId.get(from);
        const b = byId.get(to);
        if (!a || !b) return null;
        return (
          <line
            key={`${from}-${to}`}
            x1={at(a.x, 20)}
            y1={at(a.y, 5)}
            x2={at(b.x, 20)}
            y2={at(b.y, 5)}
            stroke="#9db8ff"
            strokeOpacity="0.35"
            strokeWidth="0.3"
          />
        );
      })}
      {constellationStars.map((star) => (
        <g key={star.id}>
          <circle cx={at(star.x, 20)} cy={at(star.y, 5)} r={2.2 + star.magnitude} fill="url(#apercu-constellation-etoile)" />
          <circle cx={at(star.x, 20)} cy={at(star.y, 5)} r={0.45 + star.magnitude * 0.2} fill="#f5f5f7" />
        </g>
      ))}
    </svg>
  );
}

/** Aperçu du portail : anneau irrégulier, passage sombre, halo et particules. */
function PortalPreview() {
  const centerX = 60;
  const centerY = 45;
  const radius = 21;
  const ring = (variant: number, scale: number) => {
    const points = Array.from({ length: 121 }, (_, index) => {
      const theta = (index / 120) * Math.PI * 2;
      const r =
        radius *
        scale *
        (1 +
          0.022 * Math.sin(3 * theta + variant) +
          0.015 * Math.sin(5 * theta + 1.3 * variant) +
          0.008 * Math.sin(9 * theta + variant * 2));
      return `${round(centerX + Math.cos(theta) * r)},${round(centerY + Math.sin(theta) * r)}`;
    });
    return `M${points.join("L")}Z`;
  };
  const main = ring(0, 1);
  const inner = ring(1.7, 0.965);

  const random = createRandom(20261015);
  const orbit = Array.from({ length: 90 }, () => {
    const angle = random() * Math.PI * 2;
    const distance = radius * (1.15 + random() ** 1.6 * 1.3);
    const squash = 0.3 + random() * 0.25;
    return {
      x: round(centerX + Math.cos(angle) * distance),
      y: round(centerY + Math.sin(angle) * distance * squash - 1),
      r: round(0.25 + random() * 0.45),
      blue: random() < 0.55,
      opacity: round(0.35 + random() * 0.6),
    };
  });

  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 120 90" className="size-full">
      <defs>
        <radialGradient id="apercu-portail-halo" cx="0.5" cy="0.5" r="0.55">
          <stop offset="0.2" stopColor="#253b85" stopOpacity="0.6" />
          <stop offset="1" stopColor="#253b85" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="apercu-portail-passage">
          <stop offset="0" stopColor="#020308" />
          <stop offset="0.7" stopColor="#040610" stopOpacity="0.9" />
          <stop offset="1" stopColor="#080d24" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="120" height="90" fill="url(#apercu-portail-halo)" />
      {portalDust.map((grain, index) => (
        <circle key={index} cx={grain.x} cy={grain.y} r={grain.r} fill="#cfe0ff" opacity={grain.opacity} />
      ))}
      <circle cx={centerX} cy={centerY} r={radius * 1.02} fill="url(#apercu-portail-passage)" />
      {[0.75, 0.5, 0.28].map((scale) => (
        <circle
          key={scale}
          cx={centerX}
          cy={centerY}
          r={radius * 0.92 * scale}
          fill="none"
          stroke="#4f7dff"
          strokeOpacity="0.14"
          strokeWidth="0.25"
        />
      ))}
      <path d={main} fill="none" stroke="#4f7dff" strokeOpacity="0.12" strokeWidth="3.2" />
      <path d={main} fill="none" stroke="#4f7dff" strokeOpacity="0.25" strokeWidth="1.4" />
      <path d={main} fill="none" stroke="#cfe0ff" strokeOpacity="0.75" strokeWidth="0.55" />
      <path d={main} fill="none" stroke="#ffffff" strokeOpacity="0.9" strokeWidth="0.22" />
      <path d={inner} fill="none" stroke="#cfe0ff" strokeOpacity="0.3" strokeWidth="0.2" />
      {orbit.map((particle, index) => (
        <circle
          key={index}
          cx={particle.x}
          cy={particle.y}
          r={particle.r}
          fill={particle.blue ? "#9db8ff" : "#f5f5f7"}
          opacity={particle.opacity}
        />
      ))}
    </svg>
  );
}
