import type { Metadata } from "next";
import Link from "next/link";

import { CosmicCreator } from "@/components/createur/CosmicCreator";
import { siteConfig } from "@/config/site";

const title = `Cosmic Creator — ${siteConfig.project}`;
const description = `Prototype : créez une image cosmique dans l’univers de ${siteConfig.project}.`;

export const metadata: Metadata = {
  title,
  description,
  // Prototype : la page n'est ni dans la navigation ni dans les moteurs de recherche.
  robots: { index: false, follow: false },
};

/**
 * Cosmic Creator (prototype, étape 2) : aperçu animé du portail, ambiances et
 * formats. La personnalisation fine et l'export viendront aux étapes suivantes.
 */
export default function CreateurPage() {
  return (
    <section
      aria-labelledby="titre-createur"
      className="px-5 pt-2 pb-24 sm:px-10 lg:px-24 lg:pt-6"
    >
      <CosmicCreator
        intro={
          <header className="flex flex-col gap-4">
            <Link
              href="/portail"
              className="inline-flex min-h-11 items-center gap-2 self-start text-xs tracking-[0.3em] text-star/70 uppercase transition-colors hover:text-glow"
            >
              <span aria-hidden="true">←</span>
              Portail cosmique
            </Link>
            <p className="text-xs tracking-[0.46em] text-glow uppercase">{siteConfig.project} · Prototype</p>
            <h1
              id="titre-createur"
              className="font-display text-[clamp(2.25rem,10vw,4.5rem)] leading-[0.95] font-light lg:text-6xl"
            >
              Cosmic Creator
            </h1>
            <p className="max-w-md text-[0.9375rem] leading-relaxed text-star/75">
              Choisissez une ambiance et un format : l’aperçu du portail s’adapte en direct.
            </p>
          </header>
        }
      />
    </section>
  );
}
