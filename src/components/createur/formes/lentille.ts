/**
 * Forme « Matière noire » du Cosmic Creator : une lentille gravitationnelle.
 *
 * Une masse invisible occupe le centre : un disque presque noir. Sa gravité
 * dévie la lumière de tout ce qui se trouve derrière elle (équation de la
 * lentille ponctuelle) :
 * - quelques galaxies lointaines deviennent de grands arcs irréguliers, bleu
 *   nuit et argentés. Chaque pixel autour de la masse va chercher sa lumière
 *   là où elle se trouve réellement derrière elle (lancer de rayons inverse) :
 *   les arcs sont continus et leur forme est physiquement juste. Ces galaxies
 *   restent toujours un peu décalées de l'axe : leurs arcs ne se referment
 *   jamais en anneau complet ;
 * - les étoiles du fond sont déplacées et légèrement étirées autour du centre ;
 * - une lueur de fond, elle aussi déformée, est calculée une fois.
 * Quelques particules discrètes tournent autour de la masse.
 *
 * Le fond dérive et les galaxies tournent lentement : les arcs glissent,
 * s'allongent et se rétractent. Le doigt déplace un peu la masse (toute la
 * lumière se réorganise en direct) ; un appui l'intensifie un instant.
 * Tout est tiré d'une graine : l'image exportée reprend exactement l'aperçu.
 */

import type { PortalForm, PortalFormInstance, PortalScene, PortalTheme } from "@/components/portail/portal-engine";

import { createNoise, smoothstep, type Noise } from "./bruit";

const TAU = Math.PI * 2;

/** Rayon d'Einstein (où la lumière est la plus étirée) et rayon du disque sombre (unités de scène). */
const EINSTEIN = 0.24;
const SHADOW = 0.095;
/** Étoiles du fond pour une densité de 1, dans un carré de ±FIELD unités autour du centre. */
const STARS = 1600;
const FIELD = 1.25;
const MAX_DENSITY = 1.8;
/** Particules discrètes qui tournent lentement autour de la masse. */
const PARTICLES = 260;
/** Étirement maximal d'une étoile (les grands arcs viennent des galaxies). */
const STAR_STRETCH = 2.2;
/** Dérive du fond (unités de scène par seconde). */
const DRIFT_X = 0.0075;
const DRIFT_Y = 0.003;

/**
 * Galaxies lointaines, sources des grands arcs : une principale, proche de
 * l'axe (un grand arc et un contre-arc plus faible), et deux plus lointaines
 * (arcs plus courts). Distance à l'axe, taille, éclat, décalage d'angle.
 */
const SOURCE_SPECS = [
  { radius: 0.1, size: 0.044, glow: 1, angle: 0 },
  { radius: 0.19, size: 0.032, glow: 0.8, angle: 2.3 },
  { radius: 0.28, size: 0.026, glow: 0.65, angle: 4.2 },
];
/** Taches qui composent chaque galaxie (forme irrégulière). */
const BLOBS = 4;
/** Zone des arcs autour de la masse (demi-côté, unités de scène) et finesse du calcul. */
const ARC_REGION = 0.62;
const ARC_PIXELS_PER_CELL_LIVE = 2;
const ARC_CELLS_MAX_LIVE = 240;
const ARC_CELLS_MAX_STILL = 1100;

/** Lueur de fond : cellules par unité de scène (davantage pour un export). */
const GLOW_RES = 90;
const EXPORT_PIXELS_PER_CELL = 4;
const EXPORT_GLOW_MAX = 320;

/** Dessin groupé : teinte × éclat × forme (point, ou petit arc pour une étoile étirée). */
const TONES = 3;
const LEVELS = 12;
const KINDS = 2;
const BUCKETS = TONES * LEVELS * KINDS;

type Source = { radius: number; angle: number; speed: number; blobs: Float32Array; glow: number };

/** Tirage gaussien (Box-Muller). */
const gaussian = (random: () => number) => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(TAU * random());
const parseColor = (color: string) => color.split(",").map(Number);

function createLens(random: () => number): PortalFormInstance {
  const noise: Noise = createNoise(random);
  const starCapacity = Math.ceil(STARS * MAX_DENSITY);
  const particleCapacity = Math.ceil(PARTICLES * MAX_DENSITY);
  let starCount = 0;
  let particleCount = 0;

  // Étoiles du fond : position (avant déviation), profondeur, taille, éclat, teinte.
  const starX = new Float32Array(starCapacity);
  const starY = new Float32Array(starCapacity);
  const starDepth = new Float32Array(starCapacity);
  const starSize = new Float32Array(starCapacity);
  const starGlow = new Float32Array(starCapacity);
  const starTone = new Uint8Array(starCapacity);
  const starPhase = new Float32Array(starCapacity);
  for (let index = 0; index < starCapacity; index++) {
    // Fond irrégulier : plus d'étoiles dans certaines zones.
    let x = 0;
    let y = 0;
    for (let attempt = 0; attempt < 8; attempt++) {
      x = (random() * 2 - 1) * FIELD;
      y = (random() * 2 - 1) * FIELD;
      if (random() < 0.12 + 0.88 * (0.5 + 0.5 * noise.fbm(x * 1.6 + 3.1, y * 1.6 - 7.4, 3)) ** 3) break;
    }
    starX[index] = x;
    starY[index] = y;
    starDepth[index] = 0.2 + random() * 0.8;
    starSize[index] = 0.0014 + random() ** 5 * 0.004;
    starGlow[index] = 0.25 + random() * 0.6;
    starTone[index] = random() < 0.55 ? 0 : random() < 0.6 ? 1 : 2;
    starPhase[index] = random() * TAU;
  }

  // Galaxies lointaines : toujours décalées de l'axe (arcs incomplets), elles tournent lentement.
  const firstAngle = random() * TAU;
  const sources: Source[] = SOURCE_SPECS.map((spec) => {
    // Chaque tache : position relative, largeur, éclat.
    const blobs = new Float32Array(BLOBS * 4);
    for (let blob = 0; blob < BLOBS; blob++) {
      blobs[blob * 4] = gaussian(random) * spec.size * 0.45;
      blobs[blob * 4 + 1] = gaussian(random) * spec.size * 0.45;
      blobs[blob * 4 + 2] = spec.size * (0.25 + random() * 0.35);
      blobs[blob * 4 + 3] = 0.45 + random() * 0.55;
    }
    return {
      radius: spec.radius,
      angle: firstAngle + spec.angle + (random() - 0.5) * 0.6,
      speed: (random() < 0.5 ? -1 : 1) * (0.02 + random() * 0.03),
      blobs,
      glow: spec.glow,
    };
  });

  // Particules discrètes en orbite autour de la masse.
  const particleRadius = new Float32Array(particleCapacity);
  const particleAngle = new Float32Array(particleCapacity);
  const particleSize = new Float32Array(particleCapacity);
  const particleGlow = new Float32Array(particleCapacity);
  for (let index = 0; index < particleCapacity; index++) {
    particleRadius[index] = EINSTEIN * (0.8 + random() ** 1.5 * 2.6);
    particleAngle[index] = random() * TAU;
    particleSize[index] = 0.0012 + random() * 0.002;
    particleGlow[index] = 0.15 + random() * 0.35;
  }

  // Images à dessiner à l'image en cours (étoiles et particules), puis tri par groupe.
  const imageCapacity = starCapacity * 2 + particleCapacity;
  const imageRadius = new Float32Array(imageCapacity);
  const imageAngle = new Float32Array(imageCapacity);
  const imageHalf = new Float32Array(imageCapacity);
  const imageDot = new Float32Array(imageCapacity);
  const imageBucket = new Uint16Array(imageCapacity);
  const order = new Uint32Array(imageCapacity);
  const bucketStart = new Uint32Array(BUCKETS + 1);

  /** Décalage du fond (dérive), état de l'impulsion. */
  let driftX = 0;
  let driftY = 0;
  let boost = 0;

  let glowImage: HTMLCanvasElement | null = null;
  let glowKey = "";
  let fineGlow: HTMLCanvasElement | null = null;
  let fineGlowKey = "";
  let arcImage: HTMLCanvasElement | null = null;
  let arcData: ImageData | null = null;
  let arcKey = "";

  /** Lueur de fond vue à travers la lentille (luminosité de surface conservée). */
  function paintGlow(theme: PortalTheme, halfWidth: number, halfHeight: number, resolution: number, canvas: HTMLCanvasElement) {
    const columns = Math.ceil(resolution * halfWidth * 2);
    const rows = Math.ceil(resolution * halfHeight * 2);
    canvas.width = columns;
    canvas.height = rows;
    const context = canvas.getContext("2d");
    if (!context) return;
    const image = context.createImageData(columns, rows);
    const night = parseColor(theme.night);
    const silver = parseColor(theme.ice);
    const blue = parseColor(theme.accent);
    const einstein2 = EINSTEIN * EINSTEIN;
    for (let row = 0; row < rows; row++) {
      const y = ((row + 0.5) / rows - 0.5) * halfHeight * 2;
      for (let column = 0; column < columns; column++) {
        const x = ((column + 0.5) / columns - 0.5) * halfWidth * 2;
        const r2 = x * x + y * y;
        const offset = (row * columns + column) * 4;
        if (r2 < SHADOW * SHADOW) continue;
        // Position réelle de la lumière derrière la masse (équation de la lentille).
        const bx = x - (einstein2 * x) / r2;
        const by = y - (einstein2 * y) / r2;
        const cloud = 0.5 + 0.5 * noise.fbm(bx * 2.4 + 5.3, by * 2.4 - 1.7, 4);
        const streak = 0.5 + 0.5 * noise.fbm(bx * 5.5 - 2.2, by * 5.5 + 8.8, 3);
        const value = Math.max(0, cloud - 0.42) ** 1.4 * 2.2 + Math.max(0, streak - 0.62) ** 2 * 3;
        const tint = Math.min(1, value);
        for (let channel = 0; channel < 3; channel++) {
          image.data[offset + channel] =
            night[channel] + (blue[channel] - night[channel]) * tint * 0.6 + (silver[channel] - blue[channel]) * tint * tint * 0.35;
        }
        // Lueur plus marquée près de la masse, où la lumière s'accumule.
        const near = Math.exp(-((Math.sqrt(r2) - EINSTEIN) ** 2) / (2 * 0.12 * 0.12));
        image.data[offset + 3] = Math.round(255 * Math.min(0.5, value * (0.3 + 0.2 * near)));
      }
    }
    context.putImageData(image, 0, 0);
  }

  function glowLayer(scene: PortalScene): HTMLCanvasElement | null {
    const { theme } = scene;
    const halfWidth = scene.width / scene.base / 2 + 0.1;
    const halfHeight = scene.height / scene.base / 2 + 0.1;
    const colors = `${theme.night}|${theme.ice}|${theme.accent}`;
    const pixelsPerCell = (scene.base * scene.pixelScale) / GLOW_RES;
    if (scene.still && pixelsPerCell > EXPORT_PIXELS_PER_CELL) {
      const resolution = Math.min(EXPORT_GLOW_MAX, Math.ceil((scene.base * scene.pixelScale) / EXPORT_PIXELS_PER_CELL));
      const key = `${colors}|${halfWidth.toFixed(3)}|${halfHeight.toFixed(3)}|${resolution}`;
      if (!fineGlow || fineGlowKey !== key) {
        fineGlow = fineGlow ?? document.createElement("canvas");
        paintGlow(theme, halfWidth, halfHeight, resolution, fineGlow);
        fineGlowKey = key;
      }
      return fineGlow;
    }
    const key = `${colors}|${halfWidth.toFixed(3)}|${halfHeight.toFixed(3)}`;
    if (glowImage && key === glowKey) return glowImage;
    glowImage = glowImage ?? document.createElement("canvas");
    paintGlow(theme, halfWidth, halfHeight, GLOW_RES, glowImage);
    glowKey = key;
    return glowImage;
  }

  /**
   * Grands arcs : pour chaque pixel autour de la masse, la lumière vient du
   * point (derrière la masse) que donne l'équation de la lentille. Recalculé
   * seulement quand quelque chose a changé (rien en pause).
   */
  function arcLayer(scene: PortalScene, einstein: number, intensity: number): HTMLCanvasElement | null {
    const devicePixels = ARC_REGION * 2 * scene.base * scene.pixelScale;
    const cells = scene.still
      ? Math.min(ARC_CELLS_MAX_STILL, Math.ceil(devicePixels))
      : Math.min(ARC_CELLS_MAX_LIVE, Math.ceil(devicePixels / ARC_PIXELS_PER_CELL_LIVE));
    const { theme } = scene;
    const angles = sources.map((source) => source.angle.toFixed(5)).join(",");
    const key = `${cells}|${einstein.toFixed(5)}|${intensity.toFixed(3)}|${angles}|${theme.ice}|${theme.night}|${theme.accent}`;
    if (arcImage && key === arcKey) return arcImage;
    const canvas = arcImage ?? document.createElement("canvas");
    if (canvas.width !== cells) {
      canvas.width = canvas.height = cells;
      arcData = null;
    }
    const context = canvas.getContext("2d");
    if (!context) return null;
    const image = arcData ?? context.createImageData(cells, cells);
    arcData = image;
    const data = image.data;
    data.fill(0);

    const night = parseColor(theme.night).map((value) => Math.min(255, value * 2.2 + 40));
    const blue = parseColor(theme.accent);
    const silver = parseColor(theme.ice);
    const einstein2 = einstein * einstein;
    // Taches de chaque galaxie, en coordonnées absolues (derrière la masse).
    const blobX: number[] = [];
    const blobY: number[] = [];
    const blobInv: number[] = [];
    const blobReach: number[] = [];
    const blobWeight: number[] = [];
    for (const source of sources) {
      const cx = Math.cos(source.angle) * source.radius;
      const cy = Math.sin(source.angle) * source.radius;
      for (let blob = 0; blob < BLOBS; blob++) {
        const sigma = source.blobs[blob * 4 + 2];
        blobX.push(cx + source.blobs[blob * 4]);
        blobY.push(cy + source.blobs[blob * 4 + 1]);
        blobInv.push(1 / (2 * sigma * sigma));
        blobReach.push(7 * sigma * sigma);
        blobWeight.push(source.blobs[blob * 4 + 3] * source.glow);
      }
    }
    const count = blobX.length;
    for (let row = 0; row < cells; row++) {
      const y = ((row + 0.5) / cells - 0.5) * ARC_REGION * 2;
      for (let column = 0; column < cells; column++) {
        const x = ((column + 0.5) / cells - 0.5) * ARC_REGION * 2;
        const r2 = x * x + y * y;
        if (r2 < SHADOW * SHADOW) continue;
        const factor = 1 - einstein2 / r2;
        const bx = x * factor;
        const by = y * factor;
        let value = 0;
        for (let blob = 0; blob < count; blob++) {
          const dx = bx - blobX[blob];
          const dy = by - blobY[blob];
          const d2 = dx * dx + dy * dy;
          if (d2 < blobReach[blob]) value += blobWeight[blob] * Math.exp(-d2 * blobInv[blob]);
        }
        if (value < 0.01) continue;
        value *= intensity;
        // Bords bleu nuit, cœur argenté.
        const core = smoothstep(0.25, 1.1, value);
        const offset = (row * cells + column) * 4;
        for (let channel = 0; channel < 3; channel++) {
          const edge = night[channel] + (blue[channel] - night[channel]) * Math.min(1, value);
          data[offset + channel] = edge + (silver[channel] - edge) * core;
        }
        data[offset + 3] = Math.round(255 * Math.min(1, value * 0.95));
      }
    }
    context.putImageData(image, 0, 0);
    arcImage = canvas;
    arcKey = key;
    return canvas;
  }

  /** Couleurs : argent (lumière glacée), bleu nuit éclairci, couleur dominante. */
  function toneColors(theme: PortalTheme): string[] {
    const night = theme.night.split(",").map((value) => Math.min(255, Math.round(Number(value) * 2.4 + 40)));
    return [`rgb(${theme.ice})`, `rgb(${night.join(", ")})`, `rgb(${theme.electric})`];
  }

  return {
    populate(scene) {
      starCount = Math.min(starCapacity, Math.round(STARS * scene.theme.density));
      particleCount = Math.min(particleCapacity, Math.round(PARTICLES * scene.theme.density));
    },

    adjustDensity(scene) {
      starCount = Math.min(starCapacity, Math.round(STARS * scene.theme.density));
      particleCount = Math.min(particleCapacity, Math.round(PARTICLES * scene.theme.density));
    },

    update(_scene, dt) {
      driftX += DRIFT_X * dt;
      driftY += DRIFT_Y * dt;
      for (const source of sources) source.angle += source.speed * dt;
      for (let index = 0; index < particleCount; index++) {
        // Orbites plus rapides près de la masse.
        particleAngle[index] += dt * 0.05 * (EINSTEIN / particleRadius[index]) ** 1.5;
      }
      boost *= Math.exp(-dt * 1.4);
    },

    pulse() {
      boost = 1;
    },

    render(ctx, scene) {
      const { width, height, base, theme, pointer, still, time } = scene;
      const shift = base * 0.09;
      const brightness = theme.brightness;
      const energy = Math.max(scene.energy, boost);
      // La masse se rapproche un peu du doigt (jamais en mode calme : seule la lumière réagit).
      const pull = scene.calm ? 0 : 0.18 * pointer.presence;
      const centerX = width / 2 - scene.cameraX * shift * 0.5 + (pointer.x - width / 2) * pull;
      const centerY = height / 2 - scene.cameraY * shift * 0.5 + (pointer.y - height / 2) * pull;
      const einstein = EINSTEIN * (1 + 0.12 * energy);
      const einstein2 = einstein * einstein;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = still ? "high" : "low";

      // (Pas de poussière commune : toutes les étoiles du fond passent par la lentille.)

      // Lueur de fond déformée (réglage « halo »).
      const layer = glowLayer(scene);
      if (layer && scene.reveal.halo > 0) {
        const halfWidth = width / base / 2 + 0.1;
        const halfHeight = height / base / 2 + 0.1;
        let strength = scene.reveal.halo * brightness * theme.halo * (1 + 0.4 * energy);
        while (strength > 0.001) {
          ctx.globalAlpha = Math.min(1, strength);
          ctx.drawImage(layer, centerX - halfWidth * base, centerY - halfHeight * base, halfWidth * 2 * base, halfHeight * 2 * base);
          strength -= 1;
        }
      }

      // Disque sombre : la masse absorbe la lumière qui passe trop près.
      if (scene.reveal.core > 0) {
        ctx.globalCompositeOperation = "source-over";
        const shadow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, SHADOW * base * 1.9);
        shadow.addColorStop(0, `rgba(1, 1, 3, ${0.98 * scene.reveal.core})`);
        shadow.addColorStop(0.5, `rgba(2, 2, 6, ${0.95 * scene.reveal.core})`);
        shadow.addColorStop(0.75, `rgba(4, 5, 12, ${0.5 * scene.reveal.core})`);
        shadow.addColorStop(1, "rgba(5, 5, 8, 0)");
        ctx.globalAlpha = 1;
        ctx.fillStyle = shadow;
        ctx.fillRect(centerX - SHADOW * base * 2, centerY - SHADOW * base * 2, SHADOW * base * 4, SHADOW * base * 4);
        ctx.globalCompositeOperation = "lighter";
      }

      // Grands arcs (réglage « anneau »).
      if (scene.reveal.core > 0) {
        const intensity = theme.ring * (1 + 0.5 * energy);
        const arcs = arcLayer(scene, einstein, intensity);
        if (arcs) {
          const size = ARC_REGION * 2 * base;
          let strength = scene.reveal.core * brightness;
          while (strength > 0.001) {
            ctx.globalAlpha = Math.min(1, strength);
            ctx.drawImage(arcs, centerX - size / 2, centerY - size / 2, size, size);
            strength -= 1;
          }
        }
      }

      const colors = toneColors(theme);
      const counts = new Uint32Array(BUCKETS);
      let images = 0;
      const pointerActive = pointer.presence > 0.01;
      const influence = base * 0.35;

      /** Ajoute une image déviée (rayon et angle autour de la masse) à dessiner. */
      const addImage = (radius: number, angle: number, sizeUnits: number, alpha: number, tone: number, maxStretch: number) => {
        if (radius < SHADOW * 1.05 || alpha < 0.01) return;
        const ratio = einstein2 / (radius * radius);
        const tangential = Math.min(maxStretch, 1 / Math.max(1e-3, Math.abs(1 - ratio)));
        const radial = 1 / (1 + ratio);
        let light = alpha * Math.min(1.4, Math.sqrt(tangential * radial));
        if (pointerActive) {
          const x = centerX + Math.cos(angle) * radius * base - pointer.x;
          const y = centerY + Math.sin(angle) * radius * base - pointer.y;
          light *= 1 + (scene.calm ? 1.4 : 0.8) * pointer.presence * Math.max(0, 1 - Math.sqrt(x * x + y * y) / influence);
        }
        const length = sizeUnits * tangential * base;
        const thickness = Math.max(0.55, sizeUnits * radial * base * 1.1);
        const kind = length > thickness * 1.6 ? 1 : 0;
        const level = Math.min(LEVELS - 1, Math.floor(Math.min(1, light) * LEVELS));
        imageRadius[images] = radius * base;
        imageAngle[images] = angle;
        imageHalf[images] = kind === 0 ? 0 : length / 2 / (radius * base);
        imageDot[images] = thickness;
        imageBucket[images] = (tone * LEVELS + level) * KINDS + kind;
        counts[imageBucket[images]]++;
        images++;
      };

      // Étoiles du fond, déviées : chacune donne deux images, de part et d'autre de la masse.
      const starReveal = scene.reveal.dust;
      if (starReveal > 0) {
        const lensX = (centerX - width / 2) / base;
        const lensY = (centerY - height / 2) / base;
        for (let index = 0; index < starCount; index++) {
          // Dérive du fond et perspective : le fond bouge par rapport à la masse.
          const parallax = (shift * starDepth[index] * 1.4) / base;
          let x = starX[index] + driftX - scene.cameraX * parallax - lensX;
          let y = starY[index] + driftY - scene.cameraY * parallax - lensY;
          x = ((((x + FIELD) % (2 * FIELD)) + 2 * FIELD) % (2 * FIELD)) - FIELD;
          y = ((((y + FIELD) % (2 * FIELD)) + 2 * FIELD) % (2 * FIELD)) - FIELD;
          const b = Math.sqrt(x * x + y * y) || 1e-6;
          const root = Math.sqrt(b * b + 4 * einstein2);
          const angle = Math.atan2(y, x);
          const twinkle = 0.8 + 0.2 * Math.sin(time * 1.2 + starPhase[index]);
          // Étoiles presque alignées derrière la masse : atténuées, pour que leurs images
          // ne dessinent pas un cercle régulier (les grands arcs viennent des galaxies).
          const behind = 0.2 + 0.8 * smoothstep(0.06, 0.24, b);
          const alpha = starGlow[index] * twinkle * starReveal * brightness * behind;
          addImage((b + root) / 2, angle, starSize[index], alpha, starTone[index], STAR_STRETCH);
          // Image secondaire, de l'autre côté de la masse, plus faible.
          addImage((root - b) / 2, angle + Math.PI, starSize[index], alpha * 0.6, starTone[index], STAR_STRETCH);
        }
      }

      // Particules discrètes en orbite.
      const particleReveal = scene.reveal.orbit;
      if (particleReveal > 0) {
        for (let index = 0; index < particleCount; index++) {
          addImage(particleRadius[index], particleAngle[index], particleSize[index], particleGlow[index] * particleReveal * brightness, 1, 1);
        }
      }

      // Tri par groupe, puis un seul tracé par groupe.
      bucketStart[0] = 0;
      for (let group = 0; group < BUCKETS; group++) bucketStart[group + 1] = bucketStart[group] + counts[group];
      counts.set(bucketStart.subarray(0, BUCKETS));
      for (let index = 0; index < images; index++) order[counts[imageBucket[index]]++] = index;

      ctx.lineCap = "round";
      for (let group = 0; group < BUCKETS; group++) {
        const from = bucketStart[group];
        const to = bucketStart[group + 1];
        if (from === to) continue;
        const kind = group % KINDS;
        const level = ((group - kind) / KINDS) % LEVELS;
        const tone = Math.floor(group / (KINDS * LEVELS));
        ctx.globalAlpha = (level + 0.5) / LEVELS;
        ctx.beginPath();
        if (kind === 0) {
          ctx.fillStyle = colors[tone];
          for (let k = from; k < to; k++) {
            const index = order[k];
            const x = centerX + Math.cos(imageAngle[index]) * imageRadius[index];
            const y = centerY + Math.sin(imageAngle[index]) * imageRadius[index];
            const half = imageDot[index] / 2;
            if (still) {
              ctx.moveTo(x + half, y);
              ctx.arc(x, y, half, 0, TAU);
            } else {
              ctx.rect(x - half, y - half, half * 2, half * 2);
            }
          }
          ctx.fill();
        } else {
          // Étoiles étirées : petits arcs centrés sur la masse.
          ctx.strokeStyle = colors[tone];
          ctx.lineWidth = 0.8;
          for (let k = from; k < to; k++) {
            const index = order[k];
            const start = imageAngle[index] - imageHalf[index];
            ctx.moveTo(centerX + Math.cos(start) * imageRadius[index], centerY + Math.sin(start) * imageRadius[index]);
            ctx.arc(centerX, centerY, imageRadius[index], start, imageAngle[index] + imageHalf[index]);
          }
          ctx.stroke();
        }
      }
    },
  };
}

export const matiereNoireForm: PortalForm = {
  id: "matiere-noire",
  create: createLens,
};
