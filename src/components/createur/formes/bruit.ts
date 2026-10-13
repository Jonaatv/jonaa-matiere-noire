/**
 * Outils de calcul des formes du Cosmic Creator : tirage avec graine et
 * bruit organique (bruit de gradient 2D et somme fractale). Tout est calculé
 * localement, sans dépendance.
 */

/** Générateur pseudo-aléatoire déterministe (mulberry32), pour une graine donnée. */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Empreinte d'un texte (FNV-1a), pour dériver une graine. */
export function hashText(text: string): number {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

export type Noise = {
  /** Bruit de gradient, environ entre -1 et 1. */
  noise(x: number, y: number): number;
  /** Somme fractale de `octaves` couches de bruit, environ entre -1 et 1. */
  fbm(x: number, y: number, octaves: number): number;
};

const GRADIENTS = 16;

/** Bruit de gradient 2D (type Perlin) : même tirage, même bruit. */
export function createNoise(random: () => number): Noise {
  const order = Array.from({ length: 256 }, (_, index) => index);
  for (let index = 255; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [order[index], order[swap]] = [order[swap], order[index]];
  }
  const perm = new Uint8Array(512);
  for (let index = 0; index < 512; index++) perm[index] = order[index & 255];
  const gradX = new Float32Array(GRADIENTS);
  const gradY = new Float32Array(GRADIENTS);
  for (let index = 0; index < GRADIENTS; index++) {
    const angle = (index / GRADIENTS) * Math.PI * 2;
    gradX[index] = Math.cos(angle);
    gradY[index] = Math.sin(angle);
  }

  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const dot = (hash: number, dx: number, dy: number) => {
    const index = hash & (GRADIENTS - 1);
    return gradX[index] * dx + gradY[index] * dy;
  };

  function noise(x: number, y: number) {
    const floorX = Math.floor(x);
    const floorY = Math.floor(y);
    const fx = x - floorX;
    const fy = y - floorY;
    const cellX = floorX & 255;
    const cellY = floorY & 255;
    const a = perm[cellX] + cellY;
    const b = perm[cellX + 1] + cellY;
    const u = fade(fx);
    const v = fade(fy);
    const n00 = dot(perm[a], fx, fy);
    const n01 = dot(perm[a + 1], fx, fy - 1);
    const n10 = dot(perm[b], fx - 1, fy);
    const n11 = dot(perm[b + 1], fx - 1, fy - 1);
    const top = n00 + (n10 - n00) * u;
    const bottom = n01 + (n11 - n01) * u;
    return (top + (bottom - top) * v) * 1.4;
  }

  // Chaque couche est tournée et décalée : pas d'alignement visible sur une grille.
  const COS = Math.cos(0.62);
  const SIN = Math.sin(0.62);
  function fbm(x: number, y: number, octaves: number) {
    let sum = 0;
    let amplitude = 0.5;
    let total = 0;
    let px = x;
    let py = y;
    for (let octave = 0; octave < octaves; octave++) {
      sum += amplitude * noise(px, py);
      total += amplitude;
      const nx = (px * COS - py * SIN) * 2.03 + 17.3;
      py = (px * SIN + py * COS) * 2.03 - 9.1;
      px = nx;
      amplitude *= 0.5;
    }
    return sum / total;
  }

  return { noise, fbm };
}
