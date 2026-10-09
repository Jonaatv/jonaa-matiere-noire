/**
 * Contenus officiels de l'EP MATIÈRE NOIRE.
 *
 * Règle absolue : rien n'est inventé. Tant qu'une information n'a pas été
 * fournie et vérifiée, elle reste à `null` (ou liste vide) et le site affiche
 * à la place un emplacement « À fournir » clairement identifié.
 */

/** Pochette officielle, utilisée telle quelle (aucune retouche, aucun élément ajouté). */
export type Cover = {
  /** Chemin dans `public/`, ex. "/images/matiere-noire.jpg". */
  src: string;
  /** Description de l'image pour les lecteurs d'écran. */
  alt: string;
  width: number;
  height: number;
};

/** Lien officiel vers l'EP sur une plateforme d'écoute. */
export type ListenLink = {
  /** Nom de la plateforme, tel qu'affiché sur le bouton. */
  platform: string;
  url: string;
};

export type Track = {
  title: string;
  /** Mention complémentaire facultative (featuring, durée…). */
  note?: string;
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
  clips: Clip[];
  socialLinks: SocialLink[];
};

export const release: Release = {
  format: "EP",
  cover: null,
  releaseDate: null,
  listenLinks: [],
  tracks: [],
  description: null,
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
