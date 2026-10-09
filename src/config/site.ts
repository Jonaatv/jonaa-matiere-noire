/**
 * Informations générales du site.
 *
 * Seules des informations confirmées figurent ici. Les éléments encore
 * inconnus (nom de domaine, accroche artistique…) restent à `null`
 * jusqu'à ce qu'ils soient fournis.
 */
export const siteConfig = {
  artist: "JONAA",
  project: "MATIÈRE NOIRE",
  /** Titre de l'onglet et du partage. */
  title: "JONAA — MATIÈRE NOIRE",
  /** Description factuelle utilisée pour le référencement. */
  description: "Site officiel de JONAA et de son EP MATIÈRE NOIRE.",
  /**
   * Phrase d'accroche artistique affichée sous le titre.
   * Non fournie pour l'instant : rien n'est affiché tant qu'elle vaut `null`.
   */
  tagline: null as string | null,
  locale: "fr_FR",
  /**
   * URL publique du site (ex. "https://www.exemple.fr").
   * À renseigner quand le nom de domaine sera choisi : elle servira
   * à l'URL canonique et aux images de partage.
   */
  url: null as string | null,
} as const;
