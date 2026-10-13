/**
 * Forme « Nébuleuse » du Cosmic Creator : un nuage de poussière et de lumière,
 * sans anneau.
 *
 * Un champ de densité organique (bruit fractal aux coordonnées déformées)
 * dessine des masses irrégulières, des filaments, des zones diffuses et des
 * couloirs sombres. Il sert deux fois :
 * - un gaz lumineux, calculé une fois dans une petite image puis agrandi ;
 * - des milliers de grains placés selon ce champ, qui suivent lentement des
 *   courants avant de revenir à leur place (la forme du nuage ne se défait pas).
 * Quelques étoiles et des cœurs lumineux marquent les zones les plus denses.
 *
 * Tout est tiré d'une graine : pour un même format, la nébuleuse est toujours
 * la même, et l'image exportée reprend exactement les grains de l'aperçu.
 */

import type { PortalForm, PortalFormInstance, PortalScene, PortalTheme } from "@/components/portail/portal-engine";

import { createNoise, createRandom, hashText, smoothstep, type Noise } from "./bruit";

const TAU = Math.PI * 2;

/** Grains pour une densité de 1 (même nombre sur tous les écrans : l'export suit l'aperçu). */
const PARTICLES = 6500;
/** Densité maximale du curseur, pour prévoir la place des grains. */
const MAX_DENSITY = 1.8;
const STARS = 90;
const CORES = 4;
/** Cellules du champ de densité par unité de scène (plus petite dimension). */
const FIELD_RES = 112;
/** Gaz d'une image exportée : au plus 4 pixels par cellule (sinon le gaz paraîtrait quadrillé). */
const EXPORT_PIXELS_PER_CELL = 4;
const EXPORT_FIELD_MAX = 340;
/**
 * Niveaux d'éclat des grains : les grains d'une même teinte et d'un même
 * niveau sont dessinés d'un seul trait (quelques dizaines d'appels au lieu de
 * milliers), ce qui garde l'animation fluide sur téléphone.
 */
const LEVELS = 14;
const BUCKETS = 4 * LEVELS;
/** Cellules du champ de courants par unité de scène. */
const FLOW_RES = 14;
/** Vitesse des courants, en unités de scène par seconde. */
const FLOW_SPEED = 0.018;

/** Champ calculé pour un format : densité et teinte par cellule, courants. */
type Field = {
  columns: number;
  rows: number;
  /** Demi-largeur et demi-hauteur de la scène, en unités de scène. */
  halfWidth: number;
  halfHeight: number;
  density: Float32Array;
  tint: Float32Array;
  /** Courants de poussière : filaments fins, même là où le nuage est diffus. */
  current: Float32Array;
  flowColumns: number;
  flowRows: number;
  flowX: Float32Array;
  flowY: Float32Array;
};

type Star = { x: number; y: number; size: number; glow: number; ice: boolean; phase: number; depth: number };
type Core = { x: number; y: number; size: number; glow: number };

/** Densité et teinte du nuage en un point (unités de scène, centre = 0). */
function sample(noise: Noise, x: number, y: number, halfWidth: number, halfHeight: number) {
  const scale = 1.25;
  const sx = x * scale;
  const sy = y * scale;
  // Coordonnées déformées : masses arrondies, bords effilés.
  const qx = noise.fbm(sx + 1.7, sy + 9.2, 4);
  const qy = noise.fbm(sx + 8.3, sy + 2.8, 4);
  const base = noise.fbm(sx + 1.9 * qx, sy + 1.9 * qy, 5);
  const cloud = smoothstep(-0.2, 0.48, base);
  // Filaments : crêtes fines du bruit.
  const ridge = 1 - Math.abs(noise.fbm(sx * 1.8 + 2.2 * qx + 4.4, sy * 1.8 + 2.2 * qy - 1.3, 4));
  const strands = ridge ** 7;
  // Couloirs sombres qui traversent le nuage.
  const lane = smoothstep(0.82, 0.98, 1 - Math.abs(noise.fbm(sx * 1.1 + 2.6 * qy + 7.7, sy * 1.1 + 2.6 * qx + 3.3, 3)));
  // Enveloppe : le nuage occupe la scène sans toucher les bords, avec un contour irrégulier.
  const u = x / halfWidth;
  const v = y / halfHeight;
  const radius = Math.sqrt(u * u * 0.9 + v * v) + 0.32 * noise.fbm(x * 0.9 + 11.1, y * 0.9 - 4.2, 3);
  const envelope = 1 - smoothstep(0.42, 1.08, radius);
  const density = envelope * Math.min(1, cloud * 0.9 + strands * (0.3 + 0.6 * cloud)) * (1 - 0.7 * lane);
  const tint = smoothstep(-0.45, 0.35, noise.fbm(sx * 0.55 + qx * 0.9 + 5.1, sy * 0.55 - 2.7, 3));
  const current = envelope * strands * (1 - 0.6 * lane) * (0.35 + 0.65 * smoothstep(-0.35, 0.25, base));
  return { density, tint, current };
}

type Grid = { columns: number; rows: number; density: Float32Array; tint: Float32Array; current: Float32Array };

/** Densité et teinte du nuage sur une grille de `resolution` cellules par unité de scène. */
function buildGrid(noise: Noise, halfWidth: number, halfHeight: number, resolution: number): Grid {
  const columns = Math.ceil(resolution * halfWidth * 2);
  const rows = Math.ceil(resolution * halfHeight * 2);
  const density = new Float32Array(columns * rows);
  const tint = new Float32Array(columns * rows);
  const current = new Float32Array(columns * rows);
  for (let row = 0; row < rows; row++) {
    const y = ((row + 0.5) / rows - 0.5) * halfHeight * 2;
    for (let column = 0; column < columns; column++) {
      const x = ((column + 0.5) / columns - 0.5) * halfWidth * 2;
      const value = sample(noise, x, y, halfWidth, halfHeight);
      density[row * columns + column] = value.density;
      tint[row * columns + column] = value.tint;
      current[row * columns + column] = value.current;
    }
  }
  return { columns, rows, density, tint, current };
}

/** Flou (deux passes de moyenne glissante) : le gaz reste une lueur douce, sans plis. */
function blurGrid(grid: Grid, radius: number): Grid {
  if (radius < 1) return grid;
  const { columns, rows } = grid;
  const pass = (source: Float32Array) => {
    const temp = new Float32Array(source.length);
    const out = new Float32Array(source.length);
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        let sum = 0;
        let weight = 0;
        for (let k = Math.max(0, column - radius); k <= Math.min(columns - 1, column + radius); k++) {
          sum += source[row * columns + k];
          weight++;
        }
        temp[row * columns + column] = sum / weight;
      }
    }
    for (let column = 0; column < columns; column++) {
      for (let row = 0; row < rows; row++) {
        let sum = 0;
        let weight = 0;
        for (let k = Math.max(0, row - radius); k <= Math.min(rows - 1, row + radius); k++) {
          sum += temp[k * columns + column];
          weight++;
        }
        out[row * columns + column] = sum / weight;
      }
    }
    return out;
  };
  return { columns, rows, density: pass(pass(grid.density)), tint: pass(grid.tint), current: grid.current };
}

/** Rayon du flou du gaz, en unités de scène. */
const GAS_BLUR = 0.016;

function buildField(noise: Noise, halfWidth: number, halfHeight: number): Field {
  const { columns, rows, density, tint, current } = buildGrid(noise, halfWidth, halfHeight, FIELD_RES);

  // Courants : rotationnel d'un bruit lent (écoulement sans source ni puits).
  const flowColumns = Math.ceil(FLOW_RES * halfWidth * 2) + 1;
  const flowRows = Math.ceil(FLOW_RES * halfHeight * 2) + 1;
  const flowX = new Float32Array(flowColumns * flowRows);
  const flowY = new Float32Array(flowColumns * flowRows);
  const step = 0.02;
  const stream = (x: number, y: number) => noise.fbm(x * 0.8 + 21.7, y * 0.8 - 13.4, 2);
  for (let row = 0; row < flowRows; row++) {
    const y = (row / (flowRows - 1) - 0.5) * halfHeight * 2;
    for (let column = 0; column < flowColumns; column++) {
      const x = (column / (flowColumns - 1) - 0.5) * halfWidth * 2;
      const dx = (stream(x + step, y) - stream(x - step, y)) / (2 * step);
      const dy = (stream(x, y + step) - stream(x, y - step)) / (2 * step);
      flowX[row * flowColumns + column] = dy;
      flowY[row * flowColumns + column] = -dx;
    }
  }
  return { columns, rows, halfWidth, halfHeight, density, tint, current, flowColumns, flowRows, flowX, flowY };
}

/** Tirage d'un point selon `weights` (élevé à `power` : plus fort = zones les plus marquées). */
function createSampler(field: Field, weights: Float32Array, power: number) {
  const cumulative = new Float64Array(weights.length);
  let total = 0;
  for (let index = 0; index < weights.length; index++) {
    total += weights[index] ** power;
    cumulative[index] = total;
  }
  return (random: () => number) => {
    const target = random() * total;
    let low = 0;
    let high = cumulative.length - 1;
    while (low < high) {
      const middle = (low + high) >> 1;
      if (cumulative[middle] < target) low = middle + 1;
      else high = middle;
    }
    const column = low % field.columns;
    const row = Math.floor(low / field.columns);
    return {
      x: ((column + random()) / field.columns - 0.5) * field.halfWidth * 2,
      y: ((row + random()) / field.rows - 0.5) * field.halfHeight * 2,
      cell: low,
    };
  };
}

/** Teintes des grains : bleu nuit éclairci, bleu dominant, couleur secondaire (cyan), lumière glacée. */
function toneColors(theme: PortalTheme): string[] {
  const night = theme.night.split(",").map((value) => Math.min(255, Math.round(Number(value) * 1.9 + 30)));
  return [`rgb(${night.join(", ")})`, `rgb(${theme.electric})`, `rgb(${theme.accent})`, `rgb(${theme.ice})`];
}

const mix = (a: number[], b: number[], t: number) => a.map((value, index) => value + (b[index] - value) * t);
const parseColor = (color: string) => color.split(",").map(Number);

function createNebula(random: () => number): PortalFormInstance {
  const noise = createNoise(random);
  const layoutSeed = Math.floor(random() * 4294967296);

  let field: Field | null = null;
  let fieldKey = "";
  const capacity = Math.ceil(PARTICLES * MAX_DENSITY);
  let count = 0;
  // Grains : position, point de départ, vie, apparence, décalage dû au doigt.
  const px = new Float32Array(capacity);
  const py = new Float32Array(capacity);
  const homeX = new Float32Array(capacity);
  const homeY = new Float32Array(capacity);
  const life = new Float32Array(capacity);
  const span = new Float32Array(capacity);
  const size = new Float32Array(capacity);
  const glow = new Float32Array(capacity);
  const depth = new Float32Array(capacity);
  const phase = new Float32Array(capacity);
  const ox = new Float32Array(capacity);
  const oy = new Float32Array(capacity);
  const tone = new Uint8Array(capacity);
  // Dessin groupé : position, taille et groupe (teinte × éclat) de chaque grain à l'image en cours.
  const screenX = new Float32Array(capacity);
  const screenY = new Float32Array(capacity);
  const screenSize = new Float32Array(capacity);
  const bucket = new Uint8Array(capacity);
  const order = new Uint32Array(capacity);
  const bucketStart = new Uint32Array(BUCKETS + 1);
  let stars: Star[] = [];
  let cores: Core[] = [];

  let gas: HTMLCanvasElement | null = null;
  let gasKey = "";
  // Gaz plus fin pour les images exportées (même champ, calculé plus finement).
  let fineGrid: Grid | null = null;
  let fineGas: HTMLCanvasElement | null = null;
  let fineGasKey = "";
  let waveAge = Infinity;

  function populate(scene: PortalScene) {
    const halfWidth = scene.width / scene.base / 2;
    const halfHeight = scene.height / scene.base / 2;
    const key = `${Math.ceil(FIELD_RES * halfWidth * 2)}x${Math.ceil(FIELD_RES * halfHeight * 2)}`;
    count = Math.min(capacity, Math.round(PARTICLES * scene.theme.density));
    // Même format : même nuage (seule la taille d'affichage change).
    if (key === fieldKey) return;
    fieldKey = key;
    field = buildField(noise, halfWidth, halfHeight);
    gas = null;
    fineGrid = null;
    fineGas = null;

    const layout = createRandom(layoutSeed ^ hashText(key));
    // Deux familles de grains : les masses du nuage et les courants (filaments).
    const pickMass = createSampler(field, field.density, 1.7);
    const pickCurrent = createSampler(field, field.current, 1);
    for (let index = 0; index < capacity; index++) {
      const point = index % 3 === 2 ? pickCurrent(layout) : pickMass(layout);
      px[index] = homeX[index] = point.x;
      py[index] = homeY[index] = point.y;
      span[index] = 9 + layout() * 16;
      life[index] = layout() * span[index];
      const tint = field.tint[point.cell];
      const roll = layout();
      tone[index] = roll < 0.1 ? 3 : layout() < 0.15 + tint * 0.7 ? 2 : layout() < 0.65 ? 1 : 0;
      depth[index] = 0.2 + layout() * 0.8;
      // Surtout des grains très fins, quelques-uns plus gros.
      size[index] = 0.001 + layout() ** 6 * 0.0034;
      glow[index] = (0.55 + layout() * 0.45) * (0.65 + 0.35 * Math.max(field.density[point.cell], field.current[point.cell]));
      phase[index] = layout() * TAU;
      ox[index] = oy[index] = 0;
    }

    const pickBright = createSampler(field, field.density, 4);
    stars = Array.from({ length: STARS }, () => {
      const point = pickBright(layout);
      return {
        x: point.x,
        y: point.y,
        size: 0.012 + layout() ** 2 * 0.03,
        glow: 0.35 + layout() * 0.65,
        ice: layout() < 0.6,
        phase: layout() * TAU,
        depth: 0.4 + layout() * 0.6,
      };
    });

    // Cœurs lumineux : les zones les plus denses, assez éloignées les unes des autres.
    cores = [];
    for (let attempt = 0; attempt < 200 && cores.length < CORES; attempt++) {
      const point = pickBright(layout);
      if (cores.every((core) => Math.hypot(core.x - point.x, core.y - point.y) > 0.35)) {
        cores.push({ x: point.x, y: point.y, size: 0.45 + layout() * 0.35, glow: 0.6 + layout() * 0.4 });
      }
    }
  }

  /** Gaz lumineux : le champ de densité colorié, dans une petite image agrandie au dessin. */
  function paintGas(grid: Grid, theme: PortalTheme, canvas: HTMLCanvasElement) {
    canvas.width = grid.columns;
    canvas.height = grid.rows;
    const context = canvas.getContext("2d");
    if (!context) return;
    const image = context.createImageData(grid.columns, grid.rows);
    const night = parseColor(theme.night);
    const electric = parseColor(theme.electric);
    const accent = parseColor(theme.accent);
    for (let index = 0; index < grid.density.length; index++) {
      const density = grid.density[index];
      const tint = grid.tint[index];
      // Bleu profond dans les zones diffuses, bleu dominant puis couleur secondaire dans les zones denses.
      const color = mix(mix(night, electric, smoothstep(0.02, 0.55, density)), accent, tint * smoothstep(0.1, 0.75, density) * 0.9);
      const offset = index * 4;
      image.data[offset] = color[0];
      image.data[offset + 1] = color[1];
      image.data[offset + 2] = color[2];
      image.data[offset + 3] = Math.round(255 * Math.min(1, 0.22 * density + 0.62 * density ** 1.6));
    }
    context.putImageData(image, 0, 0);

    // Cœurs lumineux diffus des zones les plus denses, intégrés au gaz (un seul dessin par image).
    if (!field) return;
    const cellsPerUnit = grid.columns / (field.halfWidth * 2);
    context.globalCompositeOperation = "lighter";
    for (const core of cores) {
      const x = (core.x / (field.halfWidth * 2) + 0.5) * grid.columns;
      const y = (core.y / (field.halfHeight * 2) + 0.5) * grid.rows;
      const radius = (core.size * cellsPerUnit) / 2;
      const glowAlpha = 0.16 * core.glow;
      const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(235, 242, 255, ${glowAlpha})`);
      gradient.addColorStop(0.18, `rgba(${theme.electric}, ${glowAlpha * 0.5})`);
      gradient.addColorStop(1, `rgba(${theme.electric}, 0)`);
      context.fillStyle = gradient;
      context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    context.globalCompositeOperation = "source-over";
  }

  function gasImage(theme: PortalTheme, scene: PortalScene): HTMLCanvasElement | null {
    if (!field) return null;
    const key = `${theme.night}|${theme.electric}|${theme.accent}`;
    const pixelsPerCell = (scene.base * scene.pixelScale) / FIELD_RES;
    if (scene.still && pixelsPerCell > EXPORT_PIXELS_PER_CELL) {
      const resolution = Math.min(EXPORT_FIELD_MAX, Math.ceil((scene.base * scene.pixelScale) / EXPORT_PIXELS_PER_CELL));
      const fineKey = `${key}|${resolution}`;
      if (!fineGas || fineGasKey !== fineKey) {
        if (!fineGrid || fineGrid.columns !== Math.ceil(resolution * field.halfWidth * 2)) {
          fineGrid = blurGrid(buildGrid(noise, field.halfWidth, field.halfHeight, resolution), Math.round(GAS_BLUR * resolution));
        }
        fineGas = fineGas ?? document.createElement("canvas");
        paintGas(fineGrid, theme, fineGas);
        fineGasKey = fineKey;
      }
      return fineGas;
    }
    if (gas && key === gasKey) return gas;
    gas = gas ?? document.createElement("canvas");
    paintGas(blurGrid(field, Math.round(GAS_BLUR * FIELD_RES)), theme, gas);
    gasKey = key;
    return gas;
  }

  function flowAt(x: number, y: number, out: { x: number; y: number }) {
    if (!field) return;
    const fx = (x / (field.halfWidth * 2) + 0.5) * (field.flowColumns - 1);
    const fy = (y / (field.halfHeight * 2) + 0.5) * (field.flowRows - 1);
    const column = Math.max(0, Math.min(field.flowColumns - 2, Math.floor(fx)));
    const row = Math.max(0, Math.min(field.flowRows - 2, Math.floor(fy)));
    const tx = Math.max(0, Math.min(1, fx - column));
    const ty = Math.max(0, Math.min(1, fy - row));
    const index = row * field.flowColumns + column;
    const below = index + field.flowColumns;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    out.x = lerp(lerp(field.flowX[index], field.flowX[index + 1], tx), lerp(field.flowX[below], field.flowX[below + 1], tx), ty);
    out.y = lerp(lerp(field.flowY[index], field.flowY[index + 1], tx), lerp(field.flowY[below], field.flowY[below + 1], tx), ty);
  }

  const flow = { x: 0, y: 0 };

  return {
    populate,

    adjustDensity(scene) {
      count = Math.min(capacity, Math.round(PARTICLES * scene.theme.density));
    },

    update(_scene, dt) {
      // Courants : chaque grain suit l'écoulement, puis revient à son point de départ
      // en fin de vie (en fondu) : le nuage garde sa forme.
      for (let index = 0; index < count; index++) {
        flowAt(px[index], py[index], flow);
        const speed = FLOW_SPEED * (0.6 + 0.8 * depth[index]);
        px[index] += flow.x * speed * dt;
        py[index] += flow.y * speed * dt;
        life[index] += dt;
        if (life[index] > span[index]) {
          life[index] = 0;
          px[index] = homeX[index];
          py[index] = homeY[index];
        }
      }
      waveAge += dt;
    },

    pulse() {
      waveAge = 0;
    },

    render(ctx, scene) {
      if (!field) return;
      const { width, height, base, theme, pointer, still, time } = scene;
      const shift = base * 0.09;
      const centerX = width / 2 - scene.cameraX * shift * 0.5;
      const centerY = height / 2 - scene.cameraY * shift * 0.5;
      const brightness = theme.brightness;

      // Gaz lumineux (le réglage « halo » en règle l'intensité).
      const image = gasImage(theme, scene);
      if (image && scene.reveal.halo > 0) {
        const gasX = width / 2 - scene.cameraX * shift * 0.35;
        const gasY = height / 2 - scene.cameraY * shift * 0.35;
        ctx.imageSmoothingEnabled = true;
        // Lissage soigné pour une image exportée ; standard (bien plus rapide) pour l'aperçu animé.
        ctx.imageSmoothingQuality = still ? "high" : "low";
        let strength = scene.reveal.halo * brightness * theme.halo * (0.9 + 0.25 * scene.energy);
        while (strength > 0.001) {
          ctx.globalAlpha = Math.min(1, strength);
          ctx.drawImage(image, gasX - width / 2, gasY - height / 2, width, height);
          strength -= 1;
        }
      }

      scene.drawDust(ctx);

      // Grains de poussière.
      const reveal = scene.reveal.orbit;
      if (reveal > 0) {
        const colors = toneColors(theme);
        const influence = base * 0.35;
        const active = pointer.presence > 0.01;
        const follow = 1 - Math.exp(-scene.frameDt * 4);
        const waveRadius = waveAge * base * 0.7;
        const waveOn = waveAge < 2.2;
        const waveStrength = waveOn ? 1.6 * (1 - waveAge / 2.2) : 0;
        const waveBand = base * 0.08;
        const counts = new Uint32Array(BUCKETS);
        for (let index = 0; index < count; index++) {
          const parallax = shift * (depth[index] - 0.5) * 1.2;
          let x = centerX + px[index] * base - scene.cameraX * parallax;
          let y = centerY + py[index] * base - scene.cameraY * parallax;

          let alpha = glow[index] * reveal * brightness;
          // Apparition et disparition en douceur le long du courant.
          const age = life[index];
          alpha *= Math.min(1, age / 1.8, (span[index] - age) / 1.8);
          alpha *= 0.78 + 0.22 * Math.sin(time * 0.9 + phase[index]);

          if (active || ox[index] !== 0 || oy[index] !== 0) {
            const dx = x - pointer.x;
            const dy = y - pointer.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            const near = Math.max(0, 1 - distance / influence);
            if (!scene.calm && !still) {
              // Le doigt écarte la poussière et l'entraîne dans son mouvement.
              const pull = pointer.presence * near * near;
              const goalX = (dx / distance) * 0.06 * pull + (pointer.vx / base) * 0.02 * pull;
              const goalY = (dy / distance) * 0.06 * pull + (pointer.vy / base) * 0.02 * pull;
              ox[index] += (goalX - ox[index]) * follow;
              oy[index] += (goalY - oy[index]) * follow;
              if (Math.abs(ox[index]) < 1e-5 && Math.abs(oy[index]) < 1e-5) ox[index] = oy[index] = 0;
            }
            x += ox[index] * base;
            y += oy[index] * base;
            alpha *= 1 + (scene.calm ? 1.4 : 0.8) * pointer.presence * near;
          }

          if (waveOn) {
            const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
            const band = (distance - waveRadius) / waveBand;
            alpha *= 1 + waveStrength * Math.exp(-band * band);
          }

          screenX[index] = x;
          screenY[index] = y;
          // Au moins un demi-pixel de la scène : la poussière reste visible sur un petit aperçu.
          screenSize[index] = Math.max(0.55, size[index] * base * (0.7 + 0.6 * depth[index]));
          const level = Math.min(LEVELS - 1, Math.floor(Math.min(1, alpha) * LEVELS));
          bucket[index] = tone[index] * LEVELS + level;
          counts[bucket[index]]++;
        }

        // Tri par groupe (comptage), puis un seul tracé par groupe.
        bucketStart[0] = 0;
        for (let group = 0; group < BUCKETS; group++) bucketStart[group + 1] = bucketStart[group] + counts[group];
        counts.set(bucketStart.subarray(0, BUCKETS));
        for (let index = 0; index < count; index++) order[counts[bucket[index]]++] = index;

        for (let group = 0; group < BUCKETS; group++) {
          const from = bucketStart[group];
          const to = bucketStart[group + 1];
          if (from === to) continue;
          const level = group % LEVELS;
          ctx.fillStyle = colors[(group - level) / LEVELS];
          ctx.globalAlpha = (level + 0.5) / LEVELS;
          ctx.beginPath();
          for (let k = from; k < to; k++) {
            const index = order[k];
            const half = screenSize[index] / 2;
            if (still) {
              ctx.moveTo(screenX[index] + half, screenY[index]);
              ctx.arc(screenX[index], screenY[index], half, 0, TAU);
            } else {
              ctx.rect(screenX[index] - half, screenY[index] - half, half * 2, half * 2);
            }
          }
          ctx.fill();
        }
      }

      // Étoiles naissantes dans les zones les plus denses (le réglage « anneau » en règle l'éclat).
      const starReveal = scene.reveal.core;
      if (starReveal > 0) {
        for (const star of stars) {
          const parallax = shift * (star.depth - 0.5) * 1.2;
          const x = centerX + star.x * base - scene.cameraX * parallax;
          const y = centerY + star.y * base - scene.cameraY * parallax;
          const twinkle = 0.7 + 0.3 * Math.sin(time * 1.3 + star.phase);
          const sizePx = star.size * base;
          ctx.globalAlpha = Math.min(1, star.glow * twinkle * starReveal * brightness * theme.ring * (1 + scene.energy * 0.6));
          ctx.drawImage(star.ice ? scene.sprites.ice : scene.sprites.blue, x - sizePx / 2, y - sizePx / 2, sizePx, sizePx);
        }
      }
    },
  };
}

export const nebuleuseForm: PortalForm = {
  id: "nebuleuse",
  create: createNebula,
};
