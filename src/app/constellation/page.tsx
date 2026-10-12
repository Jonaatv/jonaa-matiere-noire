import type { Metadata } from "next";
import type { CSSProperties } from "react";

import { Constellation } from "@/components/constellation/Constellation";
import { HomeLink } from "@/components/layout/HomeLink";
import { siteConfig } from "@/config/site";

/** Délai de l'apparition en fondu (voir `.apparition` dans globals.css). */
const delay = (seconds: number) => ({ "--delai": `${seconds}s` }) as CSSProperties;

const title = `Constellation — ${siteConfig.project}`;
const description = `Prototype : l’univers de l’EP ${siteConfig.project} de ${siteConfig.artist}, en constellation.`;

export const metadata: Metadata = {
  title,
  description,
  // Prototype : la page n'est ni dans la navigation ni dans les moteurs de recherche.
  robots: { index: false, follow: false },
};

/**
 * Prototype de constellation interactive. Les étoiles et leurs contenus
 * viennent de `src/config/constellation.ts` ; tant qu'aucun contenu officiel
 * n'est fourni, chacune n'affiche qu'un identifiant provisoire.
 */
export default function ConstellationPage() {
  return (
    <>
      {/* Halo bleu nuit derrière la constellation, sous les étoiles du site. */}
      <div aria-hidden="true" className="fond-constellation pointer-events-none fixed inset-0 -z-20" />

      <section
        aria-labelledby="titre-constellation"
        className="grid flex-1 grid-cols-1 content-start gap-8 px-5 pt-4 pb-24 sm:px-10 lg:grid-cols-12 lg:content-center lg:gap-x-16 lg:gap-y-10 lg:px-24 lg:pt-8"
      >
        <div className="flex flex-col gap-4 lg:col-span-4 lg:row-start-1 lg:self-end lg:gap-6">
          <HomeLink className="-mt-2" />
          <p className="apparition text-xs tracking-[0.46em] text-glow uppercase" style={delay(0)}>
            {siteConfig.artist} · Prototype
          </p>
          <h1
            id="titre-constellation"
            className="apparition-titre origin-left font-display text-[clamp(2rem,9.5vw,3.5rem)] leading-[0.9] font-light uppercase lg:text-[clamp(3rem,4.4vw,4.5rem)]"
          >
            Constellation
          </h1>
          <p className="apparition max-w-sm text-[0.9375rem] leading-relaxed text-star/75" style={delay(0.6)}>
            Une carte de l’univers {siteConfig.project}. Les étoiles portent pour l’instant un
            identifiant provisoire : leur nombre ne correspond pas aux titres de l’EP.
          </p>
        </div>

        <Constellation />
      </section>
    </>
  );
}
