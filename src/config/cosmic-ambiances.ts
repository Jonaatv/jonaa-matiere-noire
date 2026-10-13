/**
 * Cosmic Creator : couleurs, ambiances et formats d'image.
 *
 * Une ambiance choisit une couleur dominante et une lumière (luminosité,
 * densité, halo, anneau) ; le visiteur peut ensuite ajuster la couleur, la
 * luminosité et la densité. « Le Portail » reprend exactement les réglages de
 * la page /portail.
 */

import { DEFAULT_PORTAL_THEME, type PortalTheme } from "@/components/portail/portal-engine";

/**
 * Couleur dominante : les trois lumières du moteur, au format « r, g, b », et
 * une couleur secondaire adaptée, utilisée par les formes (Nébuleuse…).
 */
export type CosmicColor = {
  id: string;
  name: string;
  electric: string;
  ice: string;
  night: string;
  accent: string;
};

/** Palette limitée à l'univers MATIÈRE NOIRE. */
export const cosmicColors: CosmicColor[] = [
  {
    id: "bleu-electrique",
    name: "Bleu électrique",
    electric: DEFAULT_PORTAL_THEME.electric,
    ice: DEFAULT_PORTAL_THEME.ice,
    night: DEFAULT_PORTAL_THEME.night,
    // Cyan.
    accent: DEFAULT_PORTAL_THEME.accent,
  },
  {
    id: "bleu-nuit",
    name: "Bleu nuit",
    electric: "66, 92, 186",
    ice: "178, 194, 236",
    night: "48, 72, 168",
    // Cyan profond.
    accent: "58, 160, 222",
  },
  {
    id: "violet",
    name: "Violet",
    electric: "128, 92, 255",
    ice: "216, 202, 255",
    night: "72, 44, 152",
    // Bleu électrique.
    accent: "86, 132, 255",
  },
  {
    id: "argente",
    name: "Argenté",
    electric: "142, 158, 190",
    ice: "234, 238, 246",
    night: "36, 44, 70",
    // Bleu glacier.
    accent: "150, 196, 232",
  },
];

/** Lumière d'une ambiance (tout le thème sauf les couleurs). */
type Light = Pick<PortalTheme, "brightness" | "density" | "halo" | "haloSize" | "ring">;

export type CosmicAmbiance = {
  id: string;
  name: string;
  /** Courte description, affichée sous le nom. */
  description: string;
  /** Couleur dominante proposée par défaut. */
  colorId: string;
  light: Light;
};

export const cosmicAmbiances: CosmicAmbiance[] = [
  {
    id: "portail",
    name: "Le Portail",
    description: "Bleu électrique",
    colorId: "bleu-electrique",
    light: { brightness: 1, density: 1, halo: 1, haloSize: 1, ring: 1 },
  },
  {
    // Forme propre (formes/nebuleuse.ts) : nuage de poussière, sans anneau.
    // « halo » règle le gaz lumineux, « ring » l'éclat des étoiles du nuage.
    id: "nebuleuse",
    name: "Nébuleuse",
    description: "Nuage de poussière bleue et cyan",
    colorId: "bleu-electrique",
    light: { brightness: 1, density: 1, halo: 1, haloSize: 1, ring: 1 },
  },
  {
    // Énergie : anneau intense, halo resserré.
    id: "energie",
    name: "Énergie",
    description: "Bleu électrique et nuances violettes",
    colorId: "violet",
    light: { brightness: 1.15, density: 1.15, halo: 1.2, haloSize: 1, ring: 1.35 },
  },
  {
    // Matière noire : presque pas de halo, peu de particules, reflets argentés.
    id: "matiere-noire",
    name: "Matière noire",
    description: "Noir profond, reflets bleus et argentés",
    colorId: "argente",
    light: { brightness: 0.85, density: 0.7, halo: 0.4, haloSize: 0.8, ring: 0.95 },
  },
];

/** Bornes des curseurs (en multiplicateurs ; 1 = valeur de l'ambiance « Le Portail »). */
export const brightnessRange = { min: 0.5, max: 1.5, step: 0.05 } as const;
export const densityRange = { min: 0.4, max: 1.8, step: 0.1 } as const;

/** Réglages réels du moteur pour une ambiance, une couleur et des curseurs donnés. */
export function buildTheme(
  ambiance: CosmicAmbiance,
  color: CosmicColor,
  brightness: number,
  density: number,
): PortalTheme {
  return {
    ...ambiance.light,
    electric: color.electric,
    ice: color.ice,
    night: color.night,
    accent: color.accent,
    brightness,
    density,
  };
}

export type CosmicFormat = {
  id: string;
  name: string;
  /** Taille de l'image exportée, en pixels. */
  width: number;
  height: number;
};

export const cosmicFormats: CosmicFormat[] = [
  { id: "telephone", name: "Fond d’écran téléphone", width: 1290, height: 2796 },
  { id: "story", name: "Story", width: 1080, height: 1920 },
  { id: "ordinateur", name: "Fond d’écran ordinateur", width: 2560, height: 1440 },
];
