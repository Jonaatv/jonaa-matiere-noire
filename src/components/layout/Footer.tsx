import { siteConfig } from "@/config/site";

/**
 * Pied de page — réseaux sociaux, plateformes et pages légales seront
 * ajoutés lorsque les informations officielles seront disponibles.
 */
export function Footer() {
  // Site statique : l'année est celle de la dernière compilation.
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-cosmic/40 px-4 py-8 text-center text-sm text-star/60 sm:px-8">
      <p>
        © {year} {siteConfig.artist}. Tous droits réservés.
      </p>
    </footer>
  );
}
