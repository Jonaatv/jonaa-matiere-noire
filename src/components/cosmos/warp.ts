/**
 * Voyage dans l'espace piloté par le défilement.
 *
 * Chaque étoile a une position (x, y) et une profondeur z. La position de
 * défilement fait avancer une « caméra » dans la profondeur : les étoiles
 * lointaines (z proche de FAR) sont minuscules et pâles près du centre ;
 * en approchant (z vers NEAR), elles s'écartent du centre et grossissent un
 * peu. Une étoile qui dépasse la caméra repart au fond, ce qui rend le voyage
 * réversible quand on remonte la page.
 *
 * Aucune dépendance ; le dessin ne tourne que pendant le mouvement.
 */

const NEAR = 0.06;
const FAR = 1;
const DEPTH = FAR - NEAR;

/** Distance totale parcourue du haut au bas de la page (≈ 2,5 traversées du champ). */
const TRAVEL = 2.4;
/** Opacité maximale d'une étoile : le ciel reste discret derrière le texte. */
const MAX_ALPHA = 0.6;
/** Rayon d'une étoile, en pixels CSS, du plus lointain au plus proche. */
const MIN_RADIUS = 0.35;
const MAX_RADIUS = 1.4;
/** Paliers d'opacité : les étoiles sont regroupées en quelques tracés par image. */
const ALPHA_LEVELS = 6;
/** Inertie du mouvement après le défilement (secondes). */
const SMOOTHING = 0.12;
/** Longueur maximale des traînées, en unités de profondeur. */
const MAX_STREAK = 0.09;
/** Opacité des traînées, relative à celle de l'étoile. */
const STREAK_ALPHA = 0.45;
const STREAK_FACTOR = 0.05;
/** Précision de la table de vitesse (échantillons sur toute la page). */
const SAMPLES = 400;

const COLORS = ["#f5f5f7", "#9db8ff"] as const; // blanc, reflet bleu

type Star = {
  x: number;
  y: number;
  z: number;
  /** Éclat propre à l'étoile (0,5 à 1). */
  brightness: number;
  /** 0 = blanche, 1 = bleutée. */
  color: 0 | 1;
};

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

/** Modulo toujours positif. */
const wrap = (value: number, modulo: number) => ((value % modulo) + modulo) % modulo;

function createStars(count: number): Star[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * 2 - 1,
    y: Math.random() * 2 - 1,
    z: NEAR + Math.random() * DEPTH,
    brightness: 0.5 + Math.random() * 0.5,
    color: Math.random() < 0.2 ? 1 : 0,
  }));
}

/** Nombre d'étoiles selon la surface de l'écran : ~260 sur mobile, 500 au maximum. */
function starCountFor(width: number, height: number) {
  return Math.round(Math.min(500, Math.max(260, (width * height) / 2400)));
}

/**
 * Vitesse de base selon la progression dans la page (0 = haut, 1 = bas) :
 * départ lent, croisière, puis ralentissement jusqu'à un ciel presque immobile.
 */
function baseSpeed(progress: number) {
  return 0.25 + 0.75 * smoothstep(0, 0.2, progress) - 0.85 * smoothstep(0.7, 1, progress);
}

/**
 * Table « position de défilement → distance parcourue ».
 * La vitesse ajoute une accélération douce (courbe en cloche) au passage de
 * chaque séparation de section, atténuée près du bas de la page.
 */
function buildTravelTable(maxScroll: number, viewport: number, boundaries: number[]) {
  const table = new Float32Array(SAMPLES + 1);
  if (maxScroll <= 0) return table;

  const step = maxScroll / SAMPLES;
  const sigma = viewport * 0.35;
  let distance = 0;
  for (let i = 1; i <= SAMPLES; i++) {
    const y = (i - 0.5) * step;
    const progress = y / maxScroll;
    const calm = 1 - smoothstep(0.82, 1, progress);
    let speed = baseSpeed(progress);
    for (const boundary of boundaries) {
      speed += 1.1 * calm * Math.exp(-((y - boundary) ** 2) / (2 * sigma * sigma));
    }
    distance += speed * step;
    table[i] = distance;
  }
  for (let i = 1; i <= SAMPLES; i++) table[i] *= TRAVEL / distance;
  return table;
}

function travelAt(table: Float32Array, maxScroll: number, scroll: number) {
  if (maxScroll <= 0) return 0;
  const position = (Math.min(maxScroll, Math.max(0, scroll)) / maxScroll) * SAMPLES;
  const index = Math.min(SAMPLES - 1, Math.floor(position));
  const t = position - index;
  return table[index] * (1 - t) + table[index + 1] * t;
}

function draw(
  context: CanvasRenderingContext2D,
  stars: Star[],
  width: number,
  height: number,
  travel: number,
  /** Vitesse signée, en unités de profondeur par seconde. */
  velocity: number,
) {
  context.clearRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height / 2;
  const scale = Math.max(width, height) / 2;
  const streak = Math.max(-MAX_STREAK, Math.min(MAX_STREAK, velocity * STREAK_FACTOR));
  const drawStreaks = Math.abs(streak) > 0.004;

  const dots = COLORS.map(() => Array.from({ length: ALPHA_LEVELS }, () => new Path2D()));
  const trails = COLORS.map(() => Array.from({ length: ALPHA_LEVELS }, () => new Path2D()));

  for (const star of stars) {
    const z = NEAR + wrap(star.z - NEAR - travel, DEPTH);
    const x = centerX + (star.x / z) * scale;
    const y = centerY + (star.y / z) * scale;
    if (x < -4 || x > width + 4 || y < -4 || y > height + 4) continue;

    // 0 = au fond, 1 = tout près.
    const closeness = 1 - (z - NEAR) / DEPTH;
    // Apparition en fondu au fond, disparition juste avant de dépasser la caméra.
    const fade = smoothstep(0, 0.08, closeness) * (1 - smoothstep(0.9, 1, closeness));
    const alpha = MAX_ALPHA * star.brightness * (0.45 + 0.55 * closeness) * fade;
    if (alpha < 0.02) continue;

    const level = Math.min(ALPHA_LEVELS - 1, Math.floor((alpha / MAX_ALPHA) * ALPHA_LEVELS));
    const radius = MIN_RADIUS + (MAX_RADIUS - MIN_RADIUS) * closeness * closeness;
    // À cette taille (moins de 3 px), un carré est identique à l'œil et bien moins coûteux qu'un cercle.
    dots[star.color][level].rect(x - radius, y - radius, radius * 2, radius * 2);

    if (drawStreaks) {
      // Traînée vers l'endroit d'où vient l'étoile.
      const trailZ = Math.max(NEAR / 2, z + streak);
      const trail = trails[star.color][level];
      trail.moveTo(centerX + (star.x / trailZ) * scale, centerY + (star.y / trailZ) * scale);
      trail.lineTo(x, y);
    }
  }

  context.lineWidth = 0.8;
  context.lineCap = "round";
  for (let color = 0; color < COLORS.length; color++) {
    context.fillStyle = COLORS[color];
    context.strokeStyle = COLORS[color];
    for (let level = 0; level < ALPHA_LEVELS; level++) {
      const alpha = ((level + 0.5) / ALPHA_LEVELS) * MAX_ALPHA;
      if (drawStreaks) {
        context.globalAlpha = alpha * STREAK_ALPHA;
        context.stroke(trails[color][level]);
      }
      context.globalAlpha = alpha;
      context.fill(dots[color][level]);
    }
  }
  context.globalAlpha = 1;
}

/**
 * Lance l'animation sur le canvas. Renvoie la fonction d'arrêt.
 * `onReady` est appelé après la première image, pour le fondu d'apparition.
 */
export function startWarp(canvas: HTMLCanvasElement, onReady: () => void): () => void {
  const context = canvas.getContext("2d");
  if (!context) return () => {};
  const ctx: CanvasRenderingContext2D = context;

  let width = 0;
  let height = 0;
  let stars: Star[] = [];
  let table = new Float32Array(SAMPLES + 1);
  let maxScroll = 0;
  let travel = 0;
  let target = 0;
  let frame = 0;
  let lastTime = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    // Résolution limitée à 1,5× : le coût du dessin suit le nombre de pixels, et
    // pour des points d'un ou deux pixels la différence avec 2× ou 3× est invisible.
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = starCountFor(width, height);
    if (stars.length !== count) stars = createStars(count);
    draw(ctx, stars, width, height, travel, 0);
  }

  function measure() {
    const viewport = window.innerHeight;
    maxScroll = document.documentElement.scrollHeight - viewport;
    // Une séparation de section « se traverse » quand elle passe au milieu de l'écran.
    const boundaries = Array.from(document.querySelectorAll("main section[id]"))
      .slice(1)
      .map((section) => section.getBoundingClientRect().top + window.scrollY - viewport / 2);
    table = buildTravelTable(maxScroll, viewport, boundaries);
    target = travelAt(table, maxScroll, window.scrollY);
    schedule();
  }

  function schedule() {
    if (frame) return;
    lastTime = performance.now();
    frame = requestAnimationFrame(tick);
  }

  function tick(now: number) {
    frame = 0;
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    const previous = travel;
    travel += (target - travel) * (1 - Math.exp(-dt / SMOOTHING));
    const settled = Math.abs(target - travel) < 1e-5;
    if (settled) travel = target;
    // Dernière image sans traînée : à l'arrêt, plus aucun calcul.
    const velocity = settled || dt === 0 ? 0 : (travel - previous) / dt;
    draw(ctx, stars, width, height, travel, velocity);
    if (!settled) frame = requestAnimationFrame(tick);
  }

  function onScroll() {
    target = travelAt(table, maxScroll, window.scrollY);
    schedule();
  }

  // Le canvas mesure 100lvh : sa taille ne change pas quand la barre de Safari apparaît.
  const canvasObserver = new ResizeObserver(resize);
  // La hauteur de la page change (polices, images) : on recalcule les séparations.
  const pageObserver = new ResizeObserver(measure);

  resize();
  measure();
  travel = target;
  draw(ctx, stars, width, height, travel, 0);
  onReady();

  canvasObserver.observe(canvas);
  pageObserver.observe(document.body);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", measure, { passive: true });

  return () => {
    cancelAnimationFrame(frame);
    frame = 0;
    canvasObserver.disconnect();
    pageObserver.disconnect();
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", measure);
    ctx.clearRect(0, 0, width, height);
  };
}
