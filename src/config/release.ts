/**
 * Contenus officiels de l'EP MATIÈRE NOIRE.
 *
 * Règle absolue : rien n'est inventé. Tant qu'une information n'a pas été
 * fournie et vérifiée, elle reste à `null` (ou liste vide) et le site affiche
 * à la place un emplacement « À fournir » clairement identifié.
 */

/** Pochette officielle, utilisée telle quelle (aucune retouche, aucun élément ajouté). */
export type Cover = {
  /** PNG original dans `public/`, référence jamais modifiée (et image de secours). */
  src: string;
  /** Description de l'image pour les lecteurs d'écran. */
  alt: string;
  width: number;
  height: number;
  /**
   * Versions WebP allégées, générées depuis le PNG par `scripts/pochette-webp.py`
   * (redimensionnement et compression uniquement, sans recadrage ni retouche).
   */
  webp: { src: string; width: number }[];
};

/** Lien officiel vers l'EP sur une plateforme d'écoute. */
export type ListenLink = {
  /** Nom de la plateforme, tel qu'affiché sur le bouton. */
  platform: string;
  url: string;
};

export type Track = {
  title: string;
  /** Mention complémentaire facultative (featuring, version…). */
  note?: string;
  /** Durée facultative, telle qu'affichée (ex. « 3:12 »). */
  duration?: string;
};

/** Clip officiel : lien vers la page de la vidéo sur la plateforme officielle. */
export type Clip = {
  title: string;
  url: string;
};

export type SocialLink = {
  /** Nom du réseau, tel qu'affiché. */
  network: string;
  url: string;
};

export type Release = {
  /** Format du projet, mentionné dans le README du projet. */
  format: string;
  cover: Cover | null;
  /** Date de sortie au format AAAA-MM-JJ. */
  releaseDate: string | null;
  listenLinks: ListenLink[];
  tracks: Track[];
  /** Court texte de présentation (facultatif). */
  description: string | null;
  /** Crédits de l'EP (production, mix, mastering…), une ligne par crédit. */
  credits: string[];
  clips: Clip[];
  socialLinks: SocialLink[];
};

export const release: Release = {
  format: "EP",
  cover: {
    src: "/images/matiere-noire-pochette.png",
    // Proposition de texte alternatif, à valider.
    alt: "Pochette de l’EP MATIÈRE NOIRE : un ciel nocturne presque noir, parsemé d’étoiles, traversé en diagonale par une traînée lumineuse de nuages cosmiques bleu-gris. En haut, le titre « MATIÈRE NOIRE » en capitales blanches espacées ; en bas, le logo « Parental Advisory – Explicit Content ».",
    width: 1254,
    height: 1254,
    webp: [
      { src: "/images/pochette/matiere-noire-480.webp", width: 480 },
      { src: "/images/pochette/matiere-noire-800.webp", width: 800 },
      { src: "/images/pochette/matiere-noire-1254.webp", width: 1254 },
    ],
  },
  releaseDate: null,
  listenLinks: [],
  tracks: [],
  description: null,
  credits: [],
  clips: [],
  socialLinks: [],
};

/** Date de sortie mise en forme en français (ex. « 12 mars 2027 »). */
export function formatReleaseDate(isoDate: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00Z`));
}
