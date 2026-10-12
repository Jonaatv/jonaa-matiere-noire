/**
 * Constellation interactive (prototype, page `/constellation`).
 *
 * Règle absolue : rien n'est inventé. Les étoiles portent pour l'instant un
 * identifiant provisoire ; leur nombre et leur ordre sont arbitraires et ne
 * correspondent ni au nombre ni à l'ordre des titres de l'EP. Quand un
 * contenu officiel est fourni et vérifié, il suffit de remplir les champs
 * à `null` de l'étoile correspondante.
 */

/** Visuel officiel associé à une étoile. */
export type StarVisual = {
  /** Fichier dans `public/`, ex. « /images/constellation/mn-01.webp ». */
  src: string;
  /** Description de l'image pour les lecteurs d'écran. */
  alt: string;
  width: number;
  height: number;
};

/**
 * Extrait audio officiel. Réservé : il n'est encore affiché nulle part.
 * À brancher sur le lecteur officiel de la plateforme, chargé au clic du visiteur.
 */
export type StarAudio = {
  /** Nom de la plateforme du lecteur officiel. */
  platform: string;
  url: string;
};

export type ConstellationStar = {
  /** Identifiant technique stable (ne s'affiche pas). */
  id: string;
  /** Identifiant provisoire affiché tant qu'aucun titre officiel n'est fourni. */
  code: string;
  /** Position dans le ciel, en % de la largeur et de la hauteur (0 à 100). */
  x: number;
  y: number;
  /** Éclat de l'étoile : 1 discrète, 2 moyenne, 3 brillante. */
  magnitude: 1 | 2 | 3;
  /** Titre officiel du morceau, une fois confirmé. */
  title: string | null;
  /** Court texte officiel, une fois fourni. */
  text: string | null;
  visual: StarVisual | null;
  audio: StarAudio | null;
};

/** Message affiché tant qu'une étoile n'a aucun contenu officiel. */
export const comingSoonMessage = "Cette partie de l’univers sera dévoilée prochainement.";

const star = (
  index: number,
  x: number,
  y: number,
  magnitude: ConstellationStar["magnitude"],
): ConstellationStar => {
  const number = String(index).padStart(2, "0");
  return {
    id: `etoile-${number}`,
    code: `MN-${number}`,
    x,
    y,
    magnitude,
    title: null,
    text: null,
    visual: null,
    audio: null,
  };
};

/**
 * Étoiles interactives. Assez espacées pour que chaque zone de sélection
 * (44 px) reste distincte au doigt, même sur un écran de 320 px.
 */
export const constellationStars: ConstellationStar[] = [
  star(1, 12, 76, 2),
  star(2, 28, 57, 1),
  star(3, 23, 34, 2),
  star(4, 42, 22, 1),
  star(5, 50, 47, 3),
  star(6, 67, 38, 2),
  star(7, 81, 20, 1),
  star(8, 71, 64, 2),
  star(9, 87, 81, 1),
];

/** Lignes de la constellation : paires d'identifiants d'étoiles. */
export const constellationLinks: [string, string][] = [
  ["etoile-01", "etoile-02"],
  ["etoile-02", "etoile-03"],
  ["etoile-03", "etoile-04"],
  ["etoile-04", "etoile-05"],
  ["etoile-02", "etoile-05"],
  ["etoile-05", "etoile-06"],
  ["etoile-06", "etoile-07"],
  ["etoile-06", "etoile-08"],
  ["etoile-08", "etoile-09"],
];
