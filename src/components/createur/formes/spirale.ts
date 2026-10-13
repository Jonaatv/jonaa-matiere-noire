/**
 * Forme « Énergie » du Cosmic Creator : une spirale cosmique.
 *
 * Trois bras en spirale logarithmique partent d'un noyau lumineux. Chaque bras
 * porte un filament net et des filaments secondaires qui ondulent ; des
 * milliers de grains circulent le long des bras, de l'extérieur vers le noyau,
 * pendant que la spirale tourne lentement d'un seul bloc (les bras gardent
 * leur forme). Le doigt attire les grains et accélère la rotation ; un appui
 * envoie une impulsion qui illumine les bras.
 *
 * Les lueurs larges (disque, bras, noyau) sont dessinées une fois dans une
 * image, puis simplement tournée à chaque image : l'animation reste légère.
 * Tout est tiré d'une graine : l'image exportée reprend exactement l'aperçu.
 */

import type { PortalForm, PortalFormInstance, PortalScene, PortalTheme } from "@/components/portail/portal-engine";

import { smoothstep } from "./bruit";

const TAU = Math.PI * 2;

/** Grains pour une densité de 1 (même nombre sur tous les écrans : l'export suit l'aperçu). */
const PARTICLES = 5200;
/** Densité maximale du curseur, pour prévoir la place des grains. */
const MAX_DENSITY = 1.8;
const ARMS = 3;
/** Tours de chaque bras, rayon du noyau et rayon extérieur (unités de scène). */
const TURNS = 1.15;
const INNER = 0.03;
const OUTER = 0.56;
/** Écartement de la spirale logarithmique (r = INNER · e^(PITCH · θ)). */
const PITCH = Math.log(OUTER / INNER) / (TURNS * TAU);
/** Perspective : le disque est légèrement incliné. */
const SQUASH = 0.8;
const PLANE = -0.38;
/** Rotation du motif (radians par seconde) et vitesse des grains le long des bras. */
const SPIN = 0.07;
const FLOW = 0.045;
/** Rayon de l'image des lueurs, en unités de scène. */
const GLOW_RADIUS = 0.72;
/** Niveaux d'éclat des grains (dessin groupé par teinte et par éclat). */
const LEVELS = 14;
const TONES = 4;
const BUCKETS = TONES * LEVELS;
const KNOTS = 48;
const FILAMENT_POINTS = 96;

type Knot = { arm: number; u: number; lateral: number; size: number; glow: number; phase: number; ice: boolean };

/** Angle et rayon d'un point du bras `arm`, à la position `u` (0 = noyau, 1 = extrémité). */
const armAngle = (arm: number, u: number) => (arm * TAU) / ARMS + u * TURNS * TAU;
const armRadius = (u: number) => INNER * Math.exp(PITCH * u * TURNS * TAU);
/** Largeur d'un bras : fin près du noyau, plus large vers l'extérieur. */
const armWidth = (u: number) => 0.014 + 0.075 * u;

/** Tirage gaussien (Box-Muller). */
const gaussian = (random: () => number) => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(TAU * random());

function createSpiral(random: () => number): PortalFormInstance {
  const capacity = Math.ceil(PARTICLES * MAX_DENSITY);
  let count = 0;
  // Grains : bras, position le long du bras, écart au bras, apparence, décalage dû au doigt.
  const arm = new Uint8Array(capacity);
  const along = new Float32Array(capacity);
  const lateral = new Float32Array(capacity);
  const twist = new Float32Array(capacity);
  const speed = new Float32Array(capacity);
  const size = new Float32Array(capacity);
  const glow = new Float32Array(capacity);
  const depth = new Float32Array(capacity);
  const phase = new Float32Array(capacity);
  const hue = new Float32Array(capacity);
  const ox = new Float32Array(capacity);
  const oy = new Float32Array(capacity);
  // Dessin groupé : position, taille et groupe (teinte × éclat) de chaque grain à l'image en cours.
  const screenX = new Float32Array(capacity);
  const screenY = new Float32Array(capacity);
  const screenSize = new Float32Array(capacity);
  const bucket = new Uint8Array(capacity);
  const order = new Uint32Array(capacity);
  const bucketStart = new Uint32Array(BUCKETS + 1);

  for (let index = 0; index < capacity; index++) {
    arm[index] = index % ARMS;
    // Plus de grains vers l'extérieur, où les bras sont plus longs.
    along[index] = random() ** 0.7;
    // Un quart des grains forme un voile diffus entre les bras.
    const diffuse = random() < 0.25;
    lateral[index] = gaussian(random) * (diffuse ? 2.4 : 0.7);
    twist[index] = gaussian(random) * (diffuse ? 0.22 : 0.05);
    speed[index] = 0.6 + random() * 0.8;
    size[index] = 0.0011 + random() ** 6 * 0.0034;
    glow[index] = (diffuse ? 0.4 : 0.7) + random() * 0.3;
    depth[index] = 0.2 + random() * 0.8;
    phase[index] = random() * TAU;
    hue[index] = random();
  }

  const knots: Knot[] = Array.from({ length: KNOTS }, (_, index) => ({
    arm: index % ARMS,
    u: 0.12 + random() * 0.85,
    lateral: gaussian(random) * 0.4,
    size: 0.012 + random() ** 2 * 0.028,
    glow: 0.4 + random() * 0.6,
    phase: random() * TAU,
    ice: random() < 0.5,
  }));

  /** Rotation du motif (s'arrête en mode calme) et impulsion en cours. */
  let spin = 0;
  let boost = 0;

  let glowImage: HTMLCanvasElement | null = null;
  let glowKey = "";

  /** Lueurs larges, dessinées une fois à la bonne résolution (dans le plan de la spirale). */
  function glowLayer(scene: PortalScene): HTMLCanvasElement | null {
    const { theme } = scene;
    const pixels = Math.min(scene.still ? 3200 : 1400, Math.ceil(GLOW_RADIUS * 2 * scene.base * scene.pixelScale));
    const key = `${theme.electric}|${theme.accent}|${theme.ice}|${theme.night}|${pixels}`;
    if (glowImage && key === glowKey) return glowImage;
    const canvas = glowImage ?? document.createElement("canvas");
    canvas.width = canvas.height = pixels;
    const context = canvas.getContext("2d");
    if (!context) return null;
    const unit = pixels / (GLOW_RADIUS * 2);
    context.setTransform(unit, 0, 0, unit, pixels / 2, pixels / 2);
    context.globalCompositeOperation = "lighter";

    // Disque diffus.
    const disc = context.createRadialGradient(0, 0, 0, 0, 0, GLOW_RADIUS);
    disc.addColorStop(0, `rgba(${theme.night}, 0.55)`);
    disc.addColorStop(0.35, `rgba(${theme.night}, 0.28)`);
    disc.addColorStop(1, `rgba(${theme.night}, 0)`);
    context.fillStyle = disc;
    context.fillRect(-GLOW_RADIUS, -GLOW_RADIUS, GLOW_RADIUS * 2, GLOW_RADIUS * 2);

    // Lueur des bras : traits larges et très doux, du bleu (secondaire) vers la couleur dominante.
    const armLight = context.createRadialGradient(0, 0, 0, 0, 0, OUTER * 1.05);
    armLight.addColorStop(0, `rgba(${theme.accent}, 0.55)`);
    armLight.addColorStop(0.3, `rgba(${theme.accent}, 0.4)`);
    armLight.addColorStop(0.6, `rgba(${theme.electric}, 0.4)`);
    armLight.addColorStop(0.9, `rgba(${theme.electric}, 0.2)`);
    armLight.addColorStop(1, `rgba(${theme.electric}, 0)`);
    context.strokeStyle = armLight;
    context.lineCap = "round";
    for (const [width, alpha] of [
      [0.17, 0.07],
      [0.13, 0.09],
      [0.09, 0.11],
      [0.06, 0.13],
      [0.035, 0.16],
    ]) {
      context.lineWidth = width;
      context.globalAlpha = alpha;
      for (let index = 0; index < ARMS; index++) {
        context.beginPath();
        for (let point = 0; point <= FILAMENT_POINTS; point++) {
          const u = point / FILAMENT_POINTS;
          const angle = armAngle(index, u);
          const radius = armRadius(u);
          if (point === 0) context.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
          else context.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        }
        context.stroke();
      }
    }

    // Noyau lumineux.
    context.globalAlpha = 1;
    const core = context.createRadialGradient(0, 0, 0, 0, 0, 0.2);
    core.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    core.addColorStop(0.12, `rgba(${theme.ice}, 0.75)`);
    core.addColorStop(0.4, `rgba(${theme.accent}, 0.25)`);
    core.addColorStop(1, `rgba(${theme.electric}, 0)`);
    context.fillStyle = core;
    context.fillRect(-0.2, -0.2, 0.4, 0.4);

    glowImage = canvas;
    glowKey = key;
    return canvas;
  }

  /** Point du plan de la spirale → écran (rotation, inclinaison, perspective). */
  function project(scene: PortalScene, centerX: number, centerY: number, angle: number, radius: number, out: number[]) {
    const x = Math.cos(angle + spin) * radius;
    const y = Math.sin(angle + spin) * radius * SQUASH;
    out[0] = centerX + (x * Math.cos(PLANE) - y * Math.sin(PLANE)) * scene.base;
    out[1] = centerY + (x * Math.sin(PLANE) + y * Math.cos(PLANE)) * scene.base;
  }

  /** Couleurs des grains : couleur dominante, couleur secondaire, lumière glacée, bleu nuit éclairci. */
  function toneColors(theme: PortalTheme): string[] {
    const night = theme.night.split(",").map((value) => Math.min(255, Math.round(Number(value) * 1.9 + 30)));
    return [`rgb(${theme.electric})`, `rgb(${theme.accent})`, `rgb(${theme.ice})`, `rgb(${night.join(", ")})`];
  }

  const point = [0, 0];

  return {
    populate(scene) {
      count = Math.min(capacity, Math.round(PARTICLES * scene.theme.density));
    },

    adjustDensity(scene) {
      count = Math.min(capacity, Math.round(PARTICLES * scene.theme.density));
    },

    update(scene, dt) {
      // La spirale tourne d'un bloc ; le doigt et l'impulsion l'accélèrent.
      const drive = 1 + 1.2 * scene.pointer.presence + 2.5 * boost;
      spin += SPIN * drive * dt;
      // Les grains descendent le long des bras vers le noyau, puis repartent de l'extrémité.
      for (let index = 0; index < count; index++) {
        along[index] -= FLOW * speed[index] * drive * (0.35 + along[index]) * dt;
        if (along[index] < 0) along[index] += 1;
      }
      boost *= Math.exp(-dt * 1.6);
    },

    pulse() {
      boost = 1;
    },

    render(ctx, scene) {
      const { width, height, base, theme, pointer, still, time } = scene;
      const shift = base * 0.09;
      const centerX = width / 2 - scene.cameraX * shift * 0.5;
      const centerY = height / 2 - scene.cameraY * shift * 0.5;
      const brightness = theme.brightness;
      const energy = Math.max(scene.energy, boost);

      scene.drawDust(ctx);

      // Lueurs larges (le réglage « halo » en règle l'intensité), tournées avec la spirale.
      const layer = glowLayer(scene);
      if (layer && scene.reveal.halo > 0) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(PLANE);
        ctx.scale(1, SQUASH);
        ctx.rotate(spin);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = still ? "high" : "low";
        let strength = scene.reveal.halo * brightness * theme.halo * (0.85 + 0.15 * Math.sin(time * 0.8) + 0.5 * energy);
        const radius = GLOW_RADIUS * base;
        while (strength > 0.001) {
          ctx.globalAlpha = Math.min(1, strength);
          ctx.drawImage(layer, -radius, -radius, radius * 2, radius * 2);
          strength -= 1;
        }
        ctx.restore();
      }

      // Filaments : un trait net par bras et deux filaments qui ondulent autour (réglage « anneau »).
      const reveal = scene.reveal.core;
      if (reveal > 0) {
        const light = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, OUTER * base * 1.05);
        light.addColorStop(0, `rgb(${theme.ice})`);
        light.addColorStop(0.25, `rgb(${theme.accent})`);
        light.addColorStop(0.6, `rgb(${theme.electric})`);
        light.addColorStop(1, `rgba(${theme.electric}, 0)`);
        ctx.strokeStyle = light;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        const intensity = reveal * brightness * theme.ring * (1 + 0.8 * energy);
        const strands: [number, number, number, number][] = [
          // [écart, amplitude d'ondulation, épaisseur, éclat]
          [0, 0, 1.8, 0.2],
          [0, 0, 0.8, 0.6],
          [0.55, 0.5, 0.7, 0.38],
          [-0.65, 0.42, 0.6, 0.3],
        ];
        // Chaque filament est tracé par tronçons, de plus en plus pâles vers l'extrémité du bras.
        const sections = 6;
        for (const [offset, wave, lineWidth, alpha] of strands) {
          ctx.lineWidth = lineWidth;
          for (let section = 0; section < sections; section++) {
            const start = section / sections;
            const end = (section + 1) / sections;
            const fade = 1 - smoothstep(0.55, 1.05, (start + end) / 2);
            if (fade <= 0.01) continue;
            ctx.globalAlpha = Math.min(1, alpha * intensity * fade);
            ctx.beginPath();
            for (let index = 0; index < ARMS; index++) {
              const steps = FILAMENT_POINTS / sections;
              for (let step = 0; step <= steps; step++) {
                const u = 0.02 + (start + (step / steps) * (end - start)) * 0.98;
                const ripple = wave * Math.sin(u * 17 - time * 1.4 + index * 2.1 + offset * 3);
                const radius = armRadius(u) + (offset + ripple) * armWidth(u) * 0.5;
                project(scene, centerX, centerY, armAngle(index, u), radius, point);
                if (step === 0) ctx.moveTo(point[0], point[1]);
                else ctx.lineTo(point[0], point[1]);
              }
            }
            ctx.stroke();
          }
        }

        // Points brillants le long des bras.
        for (const knot of knots) {
          const radius = armRadius(knot.u) + knot.lateral * armWidth(knot.u) * 0.5;
          project(scene, centerX, centerY, armAngle(knot.arm, knot.u), radius, point);
          const sizePx = knot.size * base;
          const twinkle = 0.7 + 0.3 * Math.sin(time * 1.5 + knot.phase);
          ctx.globalAlpha = Math.min(1, knot.glow * twinkle * intensity * 0.8);
          ctx.drawImage(knot.ice ? scene.sprites.ice : scene.sprites.blue, point[0] - sizePx / 2, point[1] - sizePx / 2, sizePx, sizePx);
        }

        // Cœur du noyau, qui pulse doucement.
        const coreSize = base * (0.16 + 0.015 * Math.sin(time * 1.1)) * (1 + 0.4 * energy);
        ctx.globalAlpha = Math.min(1, 0.85 * reveal * brightness);
        ctx.drawImage(scene.sprites.ice, centerX - coreSize / 2, centerY - coreSize / 2, coreSize, coreSize);
      }

      // Grains qui circulent le long des bras.
      const revealGrains = scene.reveal.orbit;
      if (revealGrains > 0) {
        const colors = toneColors(theme);
        const influence = base * 0.35;
        const active = pointer.presence > 0.01;
        const follow = 1 - Math.exp(-scene.frameDt * 4);
        const counts = new Uint32Array(BUCKETS);
        for (let index = 0; index < count; index++) {
          const u = along[index];
          const radius = armRadius(u) + lateral[index] * armWidth(u) * 0.5;
          project(scene, centerX, centerY, armAngle(arm[index], u) + twist[index], radius, point);
          const parallax = shift * (depth[index] - 0.5) * 1.2;
          let x = point[0] - scene.cameraX * parallax;
          let y = point[1] - scene.cameraY * parallax;

          let alpha = glow[index] * revealGrains * brightness * (1 + 0.6 * energy);
          // Apparition à l'extrémité du bras, disparition dans le noyau.
          alpha *= smoothstep(0, 0.06, u) * (1 - smoothstep(0.9, 1, u));
          alpha *= 0.78 + 0.22 * Math.sin(time * 1.1 + phase[index]);

          if (active || ox[index] !== 0 || oy[index] !== 0) {
            const dx = pointer.x - x;
            const dy = pointer.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            const near = Math.max(0, 1 - distance / influence);
            if (!scene.calm && !still) {
              // Le doigt attire l'énergie des bras.
              const pull = pointer.presence * near * near;
              const goalX = (dx / base) * 0.35 * pull + (pointer.vx / base) * 0.02 * pull;
              const goalY = (dy / base) * 0.35 * pull + (pointer.vy / base) * 0.02 * pull;
              ox[index] += (goalX - ox[index]) * follow;
              oy[index] += (goalY - oy[index]) * follow;
              if (Math.abs(ox[index]) < 1e-5 && Math.abs(oy[index]) < 1e-5) ox[index] = oy[index] = 0;
            }
            x += ox[index] * base;
            y += oy[index] * base;
            alpha *= 1 + (scene.calm ? 1.4 : 0.8) * pointer.presence * near;
          }

          screenX[index] = x;
          screenY[index] = y;
          screenSize[index] = Math.max(0.55, size[index] * base * (0.7 + 0.6 * depth[index]));
          // Teinte selon la position : lumière glacée près du noyau, couleur secondaire, puis dominante.
          const h = hue[index];
          const tone = u < 0.08 + h * 0.12 ? 2 : u < 0.22 + h * 0.3 ? 1 : h < 0.1 ? 3 : 0;
          const level = Math.min(LEVELS - 1, Math.floor(Math.min(1, alpha) * LEVELS));
          bucket[index] = tone * LEVELS + level;
          counts[bucket[index]]++;
        }

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
    },
  };
}

export const energieForm: PortalForm = {
  id: "energie",
  create: createSpiral,
};
