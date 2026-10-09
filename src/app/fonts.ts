import localFont from "next/font/local";

/*
 * Polices auto-hébergées (licence SIL Open Font License, voir src/fonts/).
 * Elles sont servies avec le site : aucun appel à un service tiers au chargement.
 */

/** Titres — serif élégant, au style d'affiche de cinéma. */
export const displayFont = localFont({
  src: [
    { path: "../fonts/cormorant-garamond-latin-300-normal.woff2", weight: "300", style: "normal" },
    { path: "../fonts/cormorant-garamond-latin-500-normal.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-cormorant",
  display: "swap",
});

/** Texte courant et interface — sans-serif contemporain, très lisible. */
export const sansFont = localFont({
  src: "../fonts/manrope-latin-wght-normal.woff2",
  weight: "200 800",
  variable: "--font-manrope",
  display: "swap",
});
