/**
 * Moteur du Portail cosmique (canvas 2D, aucune dépendance).
 *
 * Un anneau de lumière irrégulier suspendu dans le noir, un halo bleu, un
 * passage sombre en son centre et trois couches de particules : poussière
 * lointaine, particules en orbite (devant et derrière l'anneau) et particules
 * aspirées vers le centre. Le doigt ou la souris attire les particules,
 * déplace légèrement la perspective et déforme l'anneau à proximité ; un
 * appui sur le portail provoque une onde lumineuse. Au relâchement, tout
 * revient doucement à l'état naturel.
 *
 * Mode calme (réduction des animations ou pause demandée) : plus aucun
 * mouvement continu ; le toucher ne produit que des variations de lumière,
 * et rien n'est dessiné quand rien ne change.
 *
 * Réglages facultatifs (`theme`, `seed`), image fixe (`snapshot`) et formes
 * (`form`) : utilisés par le Cosmic Creator. Une forme remplace l'anneau et
 * ses particules par son propre dessin ; le moteur garde tout le reste
 * (boucle d'animation, doigt, clavier, mode calme, fond, poussière, export).
 * Sans réglage ni forme, le portail reste exactement celui de la page /portail.
 */

const TAU = Math.PI * 2;

/** Rayon du portail : part de la plus petite dimension de la scène. */
export const PORTAL_RATIO = 0.26;

/** Réglages visuels du portail. */
export type PortalTheme = {
  /** Couleurs au format « r, g, b » : lumière électrique, lumière glacée, halo. */
  electric: string;
  ice: string;
  night: string;
  /** Multiplicateur de luminosité (1 = portail actuel). */
  brightness: number;
  /** Multiplicateur du nombre de particules (1 = portail actuel). */
  density: number;
  /** Intensité et étendue du halo (1 = portail actuel) : plus fort et plus large = lumière diffuse. */
  halo: number;
  haloSize: number;
  /** Intensité de l'anneau (1 = portail actuel). */
  ring: number;
};

/** Réglages du portail actuel : bleu électrique, bleu glacé, halo bleu nuit. */
export const DEFAULT_PORTAL_THEME: PortalTheme = {
  electric: "79, 125, 255",
  ice: "207, 224, 255",
  night: "37, 59, 133",
  brightness: 1,
  density: 1,
  halo: 1,
  haloSize: 1,
  ring: 1,
};

/** Durées de l'apparition (secondes). */
const INTRO = { dust: [0.1, 1], orbit: [0.5, 1.6], halo: [0.9, 2], portal: [1.4, 2.8] } as const;
const READY_AT = 2.4;

/** Images par seconde : 60 pendant une interaction, 30 au repos sur petit écran. */
const FRAME_MS_ACTIVE = 1000 / 62;
const FRAME_MS_IDLE_SMALL = 1000 / 31;

type Orbiter = {
  angle: number;
  /** Rayon de l'orbite, en part de la dimension de référence. */
  radius: number;
  speed: number;
  /** Aplatissement de l'orbite (perspective) et inclinaison de son plan. */
  squash: number;
  tilt: number;
  /** 0,3 = lointaine, 1 = proche. */
  depth: number;
  size: number;
  brightness: number;
  blue: boolean;
  twinkle: number;
  phase: number;
  /** Décalage dû au doigt, qui revient progressivement à zéro. */
  ox: number;
  oy: number;
};

type Dust = { x: number; y: number; depth: number; size: number; brightness: number; drift: number };
type Inflow = { angle: number; radius: number; speed: number; size: number };
type Wave = { age: number };
type Flare = { x: number; y: number; age: number };

/**
 * Scène transmise à une forme, à jour à chaque image. Les dimensions sont en
 * unités de la scène (pixels CSS) ; `pixelScale` donne la résolution réelle.
 */
export type PortalScene = {
  width: number;
  height: number;
  /** Plus petite dimension de la scène. */
  base: number;
  /** Petit écran (moins de 768 px de large) : prévoir moins d'éléments. */
  small: boolean;
  /** Temps de l'univers, en secondes (s'arrête en mode calme). */
  time: number;
  calm: boolean;
  theme: PortalTheme;
  /** Pointeur lissé (doigt, souris ou clavier) ; `presence` : 0 à 1. */
  pointer: { active: boolean; x: number; y: number; vx: number; vy: number; presence: number };
  /** Énergie d'une impulsion (1 juste après, puis décroît vers 0). */
  energy: number;
  /** Perspective : décalage de la caméra (-1 à 1). */
  cameraX: number;
  cameraY: number;
  frameDt: number;
  /** Apparition progressive (0 à 1) : poussière, particules, halo, cœur. */
  reveal: { dust: number; orbit: number; halo: number; core: number };
  /** Halos de particules prêts à l'emploi (redessinés en haute résolution pour un export). */
  sprites: { blue: HTMLCanvasElement; ice: HTMLCanvasElement };
  /** Image fixe (export) : rien ne doit avancer pendant ce dessin. */
  still: boolean;
  /** Pixels réels par unité de la scène (davantage pour un export). */
  pixelScale: number;
  /** Poussière lointaine commune à toutes les formes (à dessiner si la forme le souhaite). */
  drawDust(ctx: CanvasRenderingContext2D): void;
  createSprite(core: string, edge: string, size?: number): HTMLCanvasElement;
};

/** Une forme en cours d'affichage, avec ses propres éléments. */
export type PortalFormInstance = {
  /** Scène créée ou redimensionnée : (re)crée les éléments de la forme. */
  populate(scene: PortalScene): void;
  /** Densité modifiée en direct : ajoute ou retire des éléments sans recréer les autres. */
  adjustDensity(scene: PortalScene): void;
  /** Fait avancer la forme (jamais appelé en mode calme). */
  update(scene: PortalScene, dt: number): void;
  /** Dessine la forme ; le fond est déjà peint et le contexte en mode « lighter ». */
  render(ctx: CanvasRenderingContext2D, scene: PortalScene): void;
  /** Appui sur le cœur de la scène ou touche Entrée. */
  pulse?(scene: PortalScene): void;
};

/**
 * Forme du Cosmic Creator. `create` reçoit un tirage propre à la forme :
 * avec une graine, la disposition est toujours la même, et elle ne dépend
 * pas des autres formes ni des particules du portail.
 */
export type PortalForm = {
  id: string;
  create(random: () => number): PortalFormInstance;
};

export type PortalOptions = {
  /** Pas de mouvement continu (réduction des animations ou pause). */
  calm: boolean;
  /** Appelé quand l'apparition est terminée et l'univers interactif. */
  onReady?: () => void;
  /** Réglages visuels ; ceux qui manquent gardent la valeur du portail actuel. */
  theme?: Partial<PortalTheme>;
  /** Graine du tirage des particules : même graine, même ciel. Sans graine : tirage au hasard. */
  seed?: number;
  /** Forme à dessiner à la place de l'anneau. Sans forme : le portail de la page /portail. */
  form?: PortalForm | null;
};

export type PortalController = {
  setCalm(calm: boolean): void;
  /** Scène visible ou non (onglet en arrière-plan, page défilée) : arrêt complet du dessin. */
  setVisible(visible: boolean): void;
  pointerMove(x: number, y: number, pressed: boolean): void;
  pointerDown(x: number, y: number): void;
  pointerUp(x: number, y: number): void;
  /** Le doigt quitte la scène : l'univers revient à son état naturel. */
  release(): void;
  /** Clavier : déplace un pointeur virtuel (en part de la scène). */
  explore(dx: number, dy: number): void;
  /** Onde lumineuse depuis le portail. */
  pulse(): void;
  /** Change les réglages visuels sans recharger la scène (particules recréées si la densité change). */
  setTheme(theme: Partial<PortalTheme>): void;
  /** Change de forme (`null` : retour au portail), sans recharger la scène. */
  setForm(form: PortalForm | null): void;
  /**
   * Dessine l'état actuel, figé, dans un autre canvas, à `pixelWidth` pixels de
   * large (même cadrage que la scène). Avec `pixelHeight`, l'image a exactement
   * cette taille : la scène la remplit, centrée (rognage infime si les
   * proportions diffèrent d'un pixel). Fond opaque par défaut, pour un export.
   * Tout est redessiné à la taille finale : halos et poussière restent nets.
   */
  snapshot(
    target: HTMLCanvasElement,
    pixelWidth: number,
    options?: { background?: boolean; pixelHeight?: number },
  ): void;
  destroy(): void;
};

type Random = () => number;

/** Générateur pseudo-aléatoire déterministe (mulberry32), pour une graine donnée. */
function createRandom(seed: number): Random {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Rapproche `value` de `target` sans à-coup, indépendamment de la fréquence d'images. */
const ease = (value: number, target: number, rate: number, dt: number) =>
  value + (target - value) * (1 - Math.exp(-rate * dt));

/** Empreinte d'un texte (FNV-1a), pour dériver une graine propre à chaque forme. */
function hashText(text: string): number {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Halo lumineux pré-dessiné, réutilisé pour chaque particule (bien moins coûteux qu'un flou). */
function createSprite(core: string, edge: string, size = 64): HTMLCanvasElement {
  const sprite = document.createElement("canvas");
  sprite.width = sprite.height = size;
  const context = sprite.getContext("2d");
  if (!context) return sprite;
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, core);
  gradient.addColorStop(0.18, edge);
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  return sprite;
}

function createOrbiters(count: number, random: Random): Orbiter[] {
  return Array.from({ length: count }, (_, index) => {
    // Deux familles : un disque incliné autour du portail, et une coquille plus diffuse.
    const disk = index % 3 !== 0;
    const radius = disk ? 0.29 + random() ** 1.8 * 0.4 : 0.3 + random() * 0.5;
    const depth = 0.3 + random() * 0.7;
    return {
      angle: random() * TAU,
      radius,
      // Plus lentes loin du portail, comme une gravitation.
      speed: (0.05 + random() * 0.05) * (0.3 / radius) ** 1.2 * (disk ? 1 : 0.6),
      squash: disk ? 0.28 + random() * 0.2 : 0.75 + random() * 0.25,
      tilt: (disk ? -0.32 : -0.8) + random() * (disk ? 0.12 : 1.6),
      depth,
      size: 0.6 + depth * (random() < 0.08 ? 3.2 : 1.6),
      brightness: 0.5 + random() * 0.5,
      blue: random() < 0.55,
      twinkle: 0.4 + random() * 1.2,
      phase: random() * TAU,
      ox: 0,
      oy: 0,
    };
  });
}

function createDust(count: number, random: Random): Dust[] {
  return Array.from({ length: count }, () => ({
    x: random(),
    y: random(),
    depth: 0.1 + random() * 0.3,
    size: 0.5 + random() * 0.9,
    brightness: 0.15 + random() * 0.45,
    drift: (random() - 0.5) * 0.004,
  }));
}

function createInflow(count: number, random: Random): Inflow[] {
  return Array.from({ length: count }, () => ({
    angle: random() * TAU,
    radius: 0.2 + random() * 0.85,
    speed: 0.08 + random() * 0.1,
    size: 0.5 + random() * 0.9,
  }));
}

export function startPortal(canvas: HTMLCanvasElement, options: PortalOptions): PortalController {
  const maybeContext = canvas.getContext("2d");
  if (!maybeContext) {
    const noop = () => {};
    return {
      setCalm: noop,
      setVisible: noop,
      pointerMove: noop,
      pointerDown: noop,
      pointerUp: noop,
      release: noop,
      explore: noop,
      pulse: noop,
      setTheme: noop,
      setForm: noop,
      snapshot: noop,
      destroy: noop,
    };
  }
  const context: CanvasRenderingContext2D = maybeContext;

  let theme: PortalTheme = { ...DEFAULT_PORTAL_THEME, ...options.theme };
  const random: Random = options.seed === undefined ? Math.random : createRandom(options.seed);

  let blueSprite = createSprite("rgba(235, 242, 255, 1)", `rgba(${theme.electric}, 0.5)`);
  let iceSprite = createSprite("rgba(255, 255, 255, 1)", `rgba(${theme.ice}, 0.45)`);

  let width = 0;
  let height = 0;
  let base = 0; // plus petite dimension
  let small = false;
  let pixelRatio = 1;
  let orbiters: Orbiter[] = [];
  let dust: Dust[] = [];
  let inflow: Inflow[] = [];
  const waves: Wave[] = [];
  const flares: Flare[] = [];

  let calm = options.calm;
  let visible = true;
  let destroyed = false;
  let raf = 0;
  let last = 0;
  let lastDraw = 0;

  /** Temps de l'univers (s'arrête en mode calme) et temps depuis l'ouverture. */
  let time = 0;
  let intro = calm ? READY_AT + 1 : 0;
  let ready = false;

  // Pointeur : position visée, position lissée, vitesse et présence (0 à 1).
  let hasPointer = false;
  let pressed = false;
  let targetX = 0;
  let targetY = 0;
  let pointerX = 0;
  let pointerY = 0;
  let velocityX = 0;
  let velocityY = 0;
  let presence = 0;
  let cameraX = 0;
  let cameraY = 0;
  let energy = 0;
  let frameDt = 1 / 60;
  let downX = 0;
  let downY = 0;
  let downAt = 0;

  // Forme du Cosmic Creator (aucune sur la page /portail).
  let form: PortalFormInstance | null = createForm(options.form ?? null);
  const scene = {
    reveal: { dust: 0, orbit: 0, halo: 0, core: 0 },
    pointer: { active: false, x: 0, y: 0, vx: 0, vy: 0, presence: 0 },
    sprites: { blue: blueSprite, ice: iceSprite },
    drawDust: (ctx: CanvasRenderingContext2D) => drawDust(ctx, scene.reveal.dust, scene.still),
    createSprite,
  } as PortalScene;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    base = Math.min(width, height);
    small = width < 768;
    // Résolution limitée : 1,25× sur téléphone, 1,5× au-delà.
    const ratio = Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.5);
    pixelRatio = ratio;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    populate();
    schedule(true);
  }

  /** (Re)crée les particules selon la surface de la scène et la densité choisie. */
  function populate() {
    const area = width * height;
    orbiters = createOrbiters(Math.round(clamp(area / 900, 220, 480) * theme.density), random);
    dust = createDust(Math.round(clamp(area / 2600, 90, 260) * theme.density), random);
    inflow = createInflow(Math.round((small ? 26 : 44) * theme.density), random);
    if (!hasPointer) {
      pointerX = targetX = width / 2;
      pointerY = targetY = height / 2;
    }
    if (form) form.populate(syncScene());
  }

  /** Crée une forme avec son propre tirage (dérivé de la graine et du nom de la forme). */
  function createForm(next: PortalForm | null): PortalFormInstance | null {
    if (!next) return null;
    const seed = options.seed;
    return next.create(seed === undefined ? Math.random : createRandom((seed ^ hashText(next.id)) >>> 0));
  }

  /** Met à jour la scène transmise à la forme. */
  function syncScene(still = false, pixelScale = pixelRatio): PortalScene {
    scene.width = width;
    scene.height = height;
    scene.base = base;
    scene.small = small;
    scene.time = time;
    scene.calm = calm;
    scene.theme = theme;
    scene.pointer.active = hasPointer;
    scene.pointer.x = pointerX;
    scene.pointer.y = pointerY;
    scene.pointer.vx = velocityX;
    scene.pointer.vy = velocityY;
    scene.pointer.presence = presence;
    scene.energy = energy;
    scene.cameraX = cameraX;
    scene.cameraY = cameraY;
    scene.frameDt = frameDt;
    scene.reveal.dust = smoothstep(INTRO.dust[0], INTRO.dust[1], intro);
    scene.reveal.orbit = smoothstep(INTRO.orbit[0], INTRO.orbit[1], intro);
    scene.reveal.halo = smoothstep(INTRO.halo[0], INTRO.halo[1], intro);
    scene.reveal.core = smoothstep(INTRO.portal[0], INTRO.portal[1], intro);
    scene.sprites.blue = blueSprite;
    scene.sprites.ice = iceSprite;
    scene.still = still;
    scene.pixelScale = pixelScale;
    return scene;
  }

  const presenceTarget = () => (hasPointer ? (pressed ? 1 : 0.7) : 0);

  /** Faut-il encore dessiner ? En mode calme, seulement tant que la lumière évolue. */
  function needsFrame() {
    if (!calm) return true;
    return (
      Math.abs(presence - presenceTarget()) > 0.002 ||
      Math.hypot(targetX - pointerX, targetY - pointerY) > 0.5 ||
      energy > 0.002 ||
      flares.length > 0
    );
  }

  function schedule(force = false) {
    if (destroyed || !visible || raf) return;
    if (!force && !needsFrame()) return;
    raf = requestAnimationFrame(frame);
  }

  function frame(now: number) {
    raf = 0;
    if (destroyed || !visible) return;
    const interacting = hasPointer || energy > 0.01;
    const minFrame = small && !interacting && ready ? FRAME_MS_IDLE_SMALL : FRAME_MS_ACTIVE;
    if (lastDraw && now - lastDraw < minFrame - 1) {
      raf = requestAnimationFrame(frame);
      return;
    }
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    lastDraw = now;
    update(dt);
    render();
    if (needsFrame()) raf = requestAnimationFrame(frame);
    else last = 0;
  }

  function update(dt: number) {
    frameDt = dt;
    if (!calm) time += dt;
    if (intro < READY_AT + 1) intro += dt;
    if (!ready && intro >= READY_AT) {
      ready = true;
      options.onReady?.();
    }

    // Pointeur lissé et sa vitesse.
    const previousX = pointerX;
    const previousY = pointerY;
    pointerX = ease(pointerX, targetX, 14, dt);
    pointerY = ease(pointerY, targetY, 14, dt);
    velocityX = ease(velocityX, (pointerX - previousX) / Math.max(dt, 1e-3), 8, dt);
    velocityY = ease(velocityY, (pointerY - previousY) / Math.max(dt, 1e-3), 8, dt);

    // Présence : monte vite au toucher, redescend lentement au relâchement.
    presence = ease(presence, presenceTarget(), hasPointer ? 5 : 1.6, dt);
    energy *= Math.exp(-dt * (calm ? 2.6 : 1.7));

    // Perspective : la caméra suit le doigt, de façon subtile.
    const cameraTargetX = calm ? 0 : clamp((pointerX - width / 2) / (base * 0.6), -1, 1) * presence;
    const cameraTargetY = calm ? 0 : clamp((pointerY - height / 2) / (base * 0.6), -1, 1) * presence;
    cameraX = ease(cameraX, cameraTargetX, 2.2, dt);
    cameraY = ease(cameraY, cameraTargetY, 2.2, dt);

    if (!calm) {
      for (const grain of dust) grain.x = (grain.x + grain.drift * dt + 1) % 1;
      if (form) {
        form.update(syncScene(), dt);
      } else {
        for (const particle of orbiters) particle.angle += particle.speed * dt;
        for (const particle of inflow) {
          particle.radius -= particle.speed * dt * (0.4 + particle.radius);
          particle.angle += dt * (0.25 / Math.max(0.15, particle.radius));
          if (particle.radius < 0.12) {
            particle.radius = 0.95 + random() * 0.15;
            particle.angle = random() * TAU;
          }
        }
      }
    }

    for (const wave of waves) wave.age += dt;
    while (waves.length && waves[0].age > 1.8) waves.shift();
    for (const flare of flares) flare.age += dt;
    while (flares.length && flares[0].age > 1) flares.shift();
  }

  /**
   * Dessine la scène. `ctx` : canvas de la page, ou un autre canvas pour une
   * image fixe ; `background` : fond opaque (export) ; `still` : image figée,
   * sans faire avancer le retour des particules ; `pixelScale` : résolution
   * réelle de l'image (transmise aux formes).
   */
  function render(
    ctx: CanvasRenderingContext2D = context,
    background = false,
    still = false,
    pixelScale = pixelRatio,
  ) {
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, width, height);
    if (background) paintBackground(ctx);
    if (form) {
      ctx.globalCompositeOperation = "lighter";
      form.render(ctx, syncScene(still, pixelScale));
      ctx.globalCompositeOperation = "lighter";
      drawTouches(ctx);
      return;
    }

    const dustAlpha = smoothstep(INTRO.dust[0], INTRO.dust[1], intro);
    const orbitAlpha = smoothstep(INTRO.orbit[0], INTRO.orbit[1], intro);
    const haloAlpha = smoothstep(INTRO.halo[0], INTRO.halo[1], intro);
    const portalAlpha = smoothstep(INTRO.portal[0], INTRO.portal[1], intro);

    const shift = base * 0.09;
    const centerX = width / 2 - cameraX * shift * 0.5;
    const centerY = height / 2 - cameraY * shift * 0.5;
    const breath = 0.86 + 0.1 * Math.sin(time * 0.7) + 0.04 * Math.sin(time * 2.3 + 1);
    const radius = base * PORTAL_RATIO * (0.9 + 0.1 * portalAlpha) * (1 + 0.05 * energy);
    const influence = base * 0.5;

    // Halo bleu diffus.
    if (haloAlpha > 0) {
      const halo = ctx.createRadialGradient(centerX, centerY, radius * 0.4, centerX, centerY, radius * 3 * theme.haloSize);
      const strength = haloAlpha * (0.34 + 0.08 * breath + 0.25 * energy) * theme.brightness * theme.halo;
      halo.addColorStop(0, `rgba(${theme.night}, ${strength})`);
      halo.addColorStop(0.45, `rgba(${theme.night}, ${strength * 0.45})`);
      halo.addColorStop(1, `rgba(${theme.night}, 0)`);
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.globalCompositeOperation = "lighter";

    // Poussière lointaine : bouge peu, déplacée par la perspective.
    drawDust(ctx, dustAlpha, still);

    // Particules en orbite : d'abord celles derrière l'anneau.
    const follow = 1 - Math.exp(-frameDt * 5);
    const positions: { particle: Orbiter; x: number; y: number; front: boolean }[] = [];
    for (const particle of orbiters) {
      const cos = Math.cos(particle.angle);
      const sin = Math.sin(particle.angle);
      const localX = cos * particle.radius * base;
      const localY = sin * particle.radius * base * particle.squash;
      const tiltCos = Math.cos(particle.tilt);
      const tiltSin = Math.sin(particle.tilt);
      const parallax = shift * (particle.depth - 0.5) * 1.4;
      let x = centerX + localX * tiltCos - localY * tiltSin - cameraX * parallax;
      let y = centerY + localX * tiltSin + localY * tiltCos - cameraY * parallax;

      if (!calm) {
        // Attraction vers le doigt, entraînement par son mouvement, puis retour progressif.
        let goalX = 0;
        let goalY = 0;
        if (presence > 0.01) {
          const dx = pointerX - x;
          const dy = pointerY - y;
          const pull = presence * Math.max(0, 1 - Math.hypot(dx, dy) / influence) ** 2;
          goalX = dx * 0.42 * pull + velocityX * 0.06 * pull;
          goalY = dy * 0.42 * pull + velocityY * 0.06 * pull;
        }
        if (!still) {
          particle.ox += (goalX - particle.ox) * follow;
          particle.oy += (goalY - particle.oy) * follow;
        }
        x += particle.ox;
        y += particle.oy;
      }
      positions.push({ particle, x, y, front: Math.sin(particle.angle) > 0 });
    }

    const drawOrbiter = (entry: (typeof positions)[number]) => {
      const { particle, x, y } = entry;
      let alpha = particle.brightness * orbitAlpha * (0.7 + 0.3 * Math.sin(time * particle.twinkle + particle.phase));
      if (!entry.front) {
        // Derrière l'anneau : à peine visible à travers le passage sombre.
        const inside = Math.hypot(x - centerX, y - centerY) < radius * 0.95;
        alpha *= inside ? 0.18 : 0.55;
      }
      if (presence > 0.01) {
        const distance = Math.hypot(pointerX - x, pointerY - y);
        alpha *= 1 + (calm ? 1.6 : 0.8) * presence * Math.max(0, 1 - distance / influence);
      }
      alpha *= (1 + energy * 0.8) * theme.brightness;
      const size = particle.size * (0.8 + particle.depth * 0.6) * 5.5;
      ctx.globalAlpha = Math.min(1, alpha);
      ctx.drawImage(particle.blue ? blueSprite : iceSprite, x - size / 2, y - size / 2, size, size);
    };

    if (orbitAlpha > 0) for (const entry of positions) if (!entry.front) drawOrbiter(entry);

    // Passage sombre au centre du portail.
    if (portalAlpha > 0) {
      ctx.globalCompositeOperation = "source-over";
      const voidGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 1.02);
      voidGradient.addColorStop(0, `rgba(2, 3, 8, ${0.95 * portalAlpha})`);
      voidGradient.addColorStop(0.7, `rgba(4, 6, 16, ${0.85 * portalAlpha})`);
      voidGradient.addColorStop(1, "rgba(8, 13, 36, 0)");
      ctx.globalAlpha = 1;
      ctx.fillStyle = voidGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.02, 0, TAU);
      ctx.fill();
      ctx.globalCompositeOperation = "lighter";

      // Profondeur : cercles très pâles qui s'enfoncent dans le passage.
      for (let index = 0; index < 4; index++) {
        const progress = (time * 0.12 + index / 4) % 1;
        const scale = 1 - progress * 0.85;
        ctx.globalAlpha = portalAlpha * 0.16 * Math.sin(progress * Math.PI);
        ctx.strokeStyle = `rgb(${theme.electric})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radius * 0.92 * scale, radius * 0.92 * scale * (1 - Math.abs(cameraY) * 0.12), 0, 0, TAU);
        ctx.stroke();
      }

      // Particules aspirées vers le centre.
      for (const particle of inflow) {
        const r = particle.radius * radius;
        const x = centerX + Math.cos(particle.angle) * r;
        const y = centerY + Math.sin(particle.angle) * r;
        const fade = smoothstep(0.12, 0.45, particle.radius) * (1 - smoothstep(0.9, 1.1, particle.radius));
        const size = particle.size * 3 * (0.5 + particle.radius);
        ctx.globalAlpha = portalAlpha * fade * 0.7 * theme.brightness;
        ctx.drawImage(blueSprite, x - size / 2, y - size / 2, size, size);
      }

      drawRing(ctx, centerX, centerY, radius, portalAlpha, breath);
    }

    if (orbitAlpha > 0) for (const entry of positions) if (entry.front) drawOrbiter(entry);

    // Ondes lumineuses du portail.
    for (const wave of waves) {
      const progress = wave.age / 1.8;
      ctx.globalAlpha = 0.45 * (1 - progress) ** 2;
      ctx.strokeStyle = `rgb(${theme.ice})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * (1 + progress * 1.4), 0, TAU);
      ctx.stroke();
    }

    drawTouches(ctx);
  }

  /** Poussière lointaine : bouge peu, déplacée par la perspective (commune à toutes les formes). */
  function drawDust(ctx: CanvasRenderingContext2D, dustAlpha: number, still: boolean) {
    if (dustAlpha <= 0) return;
    const shift = base * 0.09;
    const influence = base * 0.5;
    for (const grain of dust) {
      let x = grain.x * width - cameraX * shift * grain.depth * 2;
      let y = grain.y * height - cameraY * shift * grain.depth * 2;
      x = ((x % width) + width) % width;
      y = ((y % height) + height) % height;
      let alpha = grain.brightness * dustAlpha * theme.brightness;
      if (hasPointer || presence > 0.01) {
        const distance = Math.hypot(pointerX - x, pointerY - y);
        alpha *= 1 + 1.4 * presence * Math.max(0, 1 - distance / influence);
      }
      ctx.globalAlpha = Math.min(1, alpha);
      ctx.fillStyle = `rgb(${theme.ice})`;
      if (still) {
        // Image fixe en haute résolution : grains ronds plutôt que carrés agrandis.
        ctx.beginPath();
        ctx.arc(x + grain.size / 2, y + grain.size / 2, grain.size / 2, 0, TAU);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, grain.size, grain.size);
      }
    }
  }

  /** Éclats là où le doigt a touché l'espace et lueur sous le doigt (communs à toutes les formes). */
  function drawTouches(ctx: CanvasRenderingContext2D) {
    for (const flare of flares) {
      const size = base * 0.18 * (calm ? 1 : 0.6 + flare.age);
      ctx.globalAlpha = 0.55 * (1 - flare.age) ** 2;
      ctx.drawImage(iceSprite, flare.x - size / 2, flare.y - size / 2, size, size);
    }

    // Lueur très douce sous le doigt.
    if (presence > 0.01) {
      const size = base * 0.32;
      ctx.globalAlpha = 0.12 * presence;
      ctx.drawImage(blueSprite, pointerX - size / 2, pointerY - size / 2, size, size);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  /** Anneau irrégulier : rayon modulé par des ondulations lentes et par la proximité du doigt. */
  function drawRing(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    alpha: number,
    breath: number,
  ) {
    const points = 150;
    const pointerAngle = Math.atan2(pointerY - centerY, pointerX - centerX);
    const pointerDistance = Math.hypot(pointerX - centerX, pointerY - centerY);
    // Proximité du doigt avec l'anneau : l'anneau se déforme vers lui.
    const near = calm ? 0 : presence * Math.exp(-(((pointerDistance - radius) / (radius * 0.7)) ** 2));
    const direction = pointerDistance > radius ? 1 : -1;
    const scaleX = 1 - Math.abs(cameraX) * 0.1;
    const scaleY = 1 - Math.abs(cameraY) * 0.1;

    const trace = (variant: number, path: Path2D) => {
      for (let index = 0; index <= points; index++) {
        const theta = (index / points) * TAU;
        let r =
          1 +
          0.022 * Math.sin(3 * theta + time * 0.31 + variant) +
          0.015 * Math.sin(5 * theta - time * 0.23 + 1.3 * variant) +
          0.008 * Math.sin(9 * theta + time * 0.6 + variant * 2);
        if (near > 0.001) {
          const diff = Math.atan2(Math.sin(theta - pointerAngle), Math.cos(theta - pointerAngle));
          r += direction * 0.09 * near * Math.exp(-(diff * diff) / (2 * 0.3 * 0.3));
        }
        r *= radius * (variant ? 0.965 : 1);
        const x = centerX + Math.cos(theta) * r * scaleX;
        const y = centerY + Math.sin(theta) * r * scaleY;
        if (index === 0) path.moveTo(x, y);
        else path.lineTo(x, y);
      }
      path.closePath();
    };

    const main = new Path2D();
    const inner = new Path2D();
    trace(0, main);
    trace(1.7, inner);

    // Luminosité variable le long de l'anneau (dégradé conique qui tourne lentement).
    let light: CanvasGradient | string = `rgb(${theme.ice})`;
    if (typeof ctx.createConicGradient === "function") {
      const conic = ctx.createConicGradient(time * 0.15, centerX, centerY);
      conic.addColorStop(0, `rgb(${theme.ice})`);
      conic.addColorStop(0.3, `rgb(${theme.electric})`);
      conic.addColorStop(0.55, "rgb(245, 248, 255)");
      conic.addColorStop(0.8, `rgb(${theme.electric})`);
      conic.addColorStop(1, `rgb(${theme.ice})`);
      light = conic;
    }

    const glow = alpha * breath * (1 + 1.2 * energy) * theme.brightness * theme.ring;
    const strokes: [Path2D, number, number, CanvasGradient | string][] = [
      [main, 22, 0.05, `rgb(${theme.electric})`],
      [main, 9, 0.1, `rgb(${theme.electric})`],
      [main, 3, 0.4, light],
      [main, 1, 0.85, "rgb(255, 255, 255)"],
      [inner, 1, 0.3, light],
    ];
    for (const [path, lineWidth, strokeAlpha, style] of strokes) {
      ctx.globalAlpha = Math.min(1, strokeAlpha * glow);
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = style;
      ctx.stroke(path);
    }

    // Point plus lumineux sur l'anneau, face au doigt.
    if (presence > 0.01) {
      const size = radius * 0.7;
      const x = centerX + Math.cos(pointerAngle) * radius * scaleX;
      const y = centerY + Math.sin(pointerAngle) * radius * scaleY;
      const proximity = presence * Math.exp(-(((pointerDistance - radius) / (radius * 1.2)) ** 2));
      ctx.globalAlpha = Math.min(1, 0.5 * proximity * alpha);
      ctx.drawImage(iceSprite, x - size / 2, y - size / 2, size, size);
    }
  }

  /**
   * Densité modifiée en direct : on ajoute ou retire des particules sans
   * recréer les autres, pour que le ciel ne « saute » pas.
   */
  function adjustDensity() {
    const area = width * height;
    const fit = <T,>(list: T[], count: number, create: (n: number) => T[]) =>
      count > list.length ? list.concat(create(count - list.length)) : list.slice(0, count);
    orbiters = fit(orbiters, Math.round(clamp(area / 900, 220, 480) * theme.density), (n) => createOrbiters(n, random));
    dust = fit(dust, Math.round(clamp(area / 2600, 90, 260) * theme.density), (n) => createDust(n, random));
    inflow = fit(inflow, Math.round((small ? 26 : 44) * theme.density), (n) => createInflow(n, random));
    if (form) form.adjustDensity(syncScene());
  }

  /** Fond noir et bleu nuit, pour une image exportée (le portail de la page reste transparent). */
  function paintBackground(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "rgb(5, 5, 8)";
    ctx.fillRect(0, 0, width, height);
    const glow = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) * 0.75);
    glow.addColorStop(0, "rgba(8, 13, 36, 0.9)");
    glow.addColorStop(1, "rgba(8, 13, 36, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }

  function isOnPortal(x: number, y: number) {
    return Math.hypot(x - width / 2, y - height / 2) < base * PORTAL_RATIO * 1.35;
  }

  function pulse() {
    energy = 1;
    if (!calm && form) {
      form.pulse?.(syncScene());
    } else if (!calm) {
      waves.push({ age: 0 });
      if (waves.length > 3) waves.shift();
      // Les particules sont repoussées vers l'extérieur, puis reviennent.
      for (const particle of orbiters) {
        const angle = particle.angle + particle.tilt;
        particle.ox += Math.cos(angle) * base * 0.05 * particle.depth;
        particle.oy += Math.sin(angle) * base * 0.05 * particle.depth;
      }
    }
    schedule(true);
  }

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  return {
    setCalm(value) {
      if (calm === value) return;
      calm = value;
      if (calm) intro = Math.max(intro, READY_AT + 1);
      last = 0;
      schedule(true);
    },
    setVisible(value) {
      if (visible === value) return;
      visible = value;
      if (!visible) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      last = 0;
      schedule(true);
    },
    pointerMove(x, y, isPressed) {
      hasPointer = true;
      pressed = isPressed;
      targetX = x;
      targetY = y;
      schedule(true);
    },
    pointerDown(x, y) {
      hasPointer = true;
      pressed = true;
      targetX = pointerX = x;
      targetY = pointerY = y;
      downX = x;
      downY = y;
      downAt = performance.now();
      schedule(true);
    },
    pointerUp(x, y) {
      pressed = false;
      // Un appui bref et immobile : réaction lumineuse.
      if (performance.now() - downAt < 350 && Math.hypot(x - downX, y - downY) < 12) {
        if (isOnPortal(x, y)) pulse();
        else {
          flares.push({ x, y, age: 0 });
          if (flares.length > 4) flares.shift();
        }
      }
      schedule(true);
    },
    release() {
      hasPointer = false;
      pressed = false;
      schedule(true);
    },
    explore(dx, dy) {
      if (!hasPointer) {
        targetX = pointerX = width / 2;
        targetY = pointerY = height / 2;
      }
      hasPointer = true;
      targetX = clamp(targetX + dx * width, 0, width);
      targetY = clamp(targetY + dy * height, 0, height);
      schedule(true);
    },
    pulse,
    setTheme(next) {
      const previous = theme;
      theme = { ...theme, ...next };
      if (theme.electric !== previous.electric) {
        blueSprite = createSprite("rgba(235, 242, 255, 1)", `rgba(${theme.electric}, 0.5)`);
      }
      if (theme.ice !== previous.ice) {
        iceSprite = createSprite("rgba(255, 255, 255, 1)", `rgba(${theme.ice}, 0.45)`);
      }
      if (theme.density !== previous.density) adjustDensity();
      schedule(true);
    },
    setForm(next) {
      form = createForm(next);
      if (form) form.populate(syncScene());
      schedule(true);
    },
    snapshot(target, pixelWidth, snapshotOptions = {}) {
      const targetContext = target.getContext("2d");
      if (!targetContext) return;
      const pixelHeight = snapshotOptions.pixelHeight;
      const scale = pixelHeight ? Math.max(pixelWidth / width, pixelHeight / height) : pixelWidth / width;
      target.width = pixelWidth;
      target.height = pixelHeight ?? Math.round(height * scale);
      // Scène centrée : elle couvre toute l'image.
      const offsetX = (target.width - width * scale) / 2;
      const offsetY = (target.height - height * scale) / 2;
      targetContext.setTransform(scale, 0, 0, scale, offsetX, offsetY);

      // Halos des particules redessinés à la taille finale (sinon ils seraient flous).
      const liveBlue = blueSprite;
      const liveIce = iceSprite;
      if (scale > 1) {
        const size = Math.min(512, 64 * Math.ceil(scale));
        blueSprite = createSprite("rgba(235, 242, 255, 1)", `rgba(${theme.electric}, 0.5)`, size);
        iceSprite = createSprite("rgba(255, 255, 255, 1)", `rgba(${theme.ice}, 0.45)`, size);
      }
      try {
        render(targetContext, snapshotOptions.background ?? true, true, scale);
      } finally {
        blueSprite = liveBlue;
        iceSprite = liveIce;
      }
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      raf = 0;
      observer.disconnect();
    },
  };
}
