import { PlaceholderPill } from "@/components/ui/Placeholder";
import { siteConfig } from "@/config/site";

/** Pied de page — la page des mentions légales sera ajoutée une fois les informations fournies. */
export function Footer() {
  // Site statique : l'année est celle de la dernière compilation.
  const year = new Date().getFullYear();

  return (
    <footer className="flex flex-col gap-4 border-t border-cosmic/45 px-5 py-8 text-xs text-star/60 sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:text-[0.8125rem] lg:px-24 lg:py-10">
      <p>
        © {year} {siteConfig.artist}. Tous droits réservés.
      </p>
      <PlaceholderPill label="mentions légales" className="self-start sm:self-auto" />
    </footer>
  );
}
