/**
 * Fond étoilé statique, fixe derrière tout le site : halo bleu nuit et étoiles.
 *
 * C'est aussi le fond de secours du voyage au défilement (`WarpField`) : affiché
 * sans JavaScript, pendant le chargement et si le visiteur a demandé de réduire
 * les animations. Quand le voyage démarre, seules les étoiles s'effacent ; le
 * halo reste.
 *
 * Aucun JavaScript côté visiteur : les positions sont calculées une fois, au
 * build, avec un générateur pseudo-aléatoire à graine fixe (même ciel à chaque
 * compilation). Les étoiles sont fines et peu lumineuses ; seules quelques-unes
 * scintillent, et uniquement si le visiteur accepte les animations (voir
 * `.scintille` dans globals.css).
 */

const STAR_COUNT = 150;
const TWINKLE_EVERY = 12; // une étoile sur 12 scintille
const SEED = 20261009;

type Star = {
  x: number;
  y: number;
  r: number;
  opacity: number;
  blue: boolean;
  twinkle: boolean;
  delay: number;
};

/** Générateur pseudo-aléatoire déterministe (mulberry32). */
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

function createStars(): Star[] {
  const random = createRandom(SEED);
  return Array.from({ length: STAR_COUNT }, (_, index) => {
    const size = random();
    return {
      x: round(random() * 1000),
      y: round(random() * 1000),
      // Majorité de très petites étoiles, quelques-unes un peu plus marquées.
      r: round(0.35 + size * size * 0.9),
      opacity: round(0.15 + random() * 0.5),
      blue: random() < 0.2,
      twinkle: index % TWINKLE_EVERY === 0,
      delay: round(random() * 6),
    };
  });
}

const stars = createStars();

export function StarField() {
  return (
    <div aria-hidden="true" className="ciel pointer-events-none fixed inset-0 -z-10">
      <svg
        className="etoiles-statiques h-full w-full"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        {stars.map((star, index) => (
          <circle
            key={index}
            cx={star.x}
            cy={star.y}
            r={star.r}
            fill={star.blue ? "var(--color-glow)" : "var(--color-star)"}
            opacity={star.opacity}
            className={star.twinkle ? "scintille" : undefined}
            style={star.twinkle ? { animationDelay: `-${star.delay}s` } : undefined}
          />
        ))}
      </svg>
    </div>
  );
}
