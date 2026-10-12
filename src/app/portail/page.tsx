import type { Metadata } from "next";

import { HomeLink } from "@/components/layout/HomeLink";
import { CosmicPortal } from "@/components/portail/CosmicPortal";
import { siteConfig } from "@/config/site";

const title = `Portail cosmique — ${siteConfig.project}`;
const description = `Prototype : une expérience interactive dans l’univers de ${siteConfig.project}.`;

export const metadata: Metadata = {
  title,
  description,
  // Prototype : la page n'est ni dans la navigation ni dans les moteurs de recherche.
  robots: { index: false, follow: false },
};

/**
 * Portail cosmique (prototype). Expérience autonome : elle ne dépend
 * d'aucun contenu de l'EP (titres, pochette, dates).
 */
export default function PortailPage() {
  return (
    <section aria-labelledby="titre-portail" className="relative flex flex-col">
      <div className="absolute top-0 left-5 z-10 flex flex-col sm:left-10 lg:left-24">
        <HomeLink />
        <h1
          id="titre-portail"
          className="pointer-events-none text-xs tracking-[0.46em] text-glow uppercase"
        >
          Portail cosmique
        </h1>
      </div>

      {/*
        Hauteur de l'écran sous l'en-tête, moins une bande en bas : on peut
        toujours y faire défiler la page au doigt (la scène, elle, ne défile pas).
      */}
      <div className="h-[calc(100svh-var(--hauteur-entete-mobile)-3rem)] min-h-80 lg:h-[calc(100svh-7rem-2rem)]">
        <CosmicPortal />
      </div>
    </section>
  );
}
