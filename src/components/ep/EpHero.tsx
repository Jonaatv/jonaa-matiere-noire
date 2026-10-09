import type { CSSProperties, ReactNode } from "react";

import { CoverArt } from "@/components/release/CoverArt";
import { PlaceholderPill } from "@/components/ui/Placeholder";
import { formatReleaseDate, release } from "@/config/release";
import { siteConfig } from "@/config/site";

/** Délai de l'apparition en fondu (voir `.apparition` dans globals.css). */
const delay = (seconds: number) => ({ "--delai": `${seconds}s` }) as CSSProperties;

/**
 * Premier écran de la page EP : la pochette en grand, le titre et la fiche
 * de l'EP (artiste, format, sortie, nombre de titres). Les informations
 * manquantes restent des emplacements « À fournir ».
 */
export function EpHero() {
  const { releaseDate, tracks } = release;

  return (
    <section
      aria-labelledby="titre-ep-page"
      className="grid grid-cols-1 items-center gap-12 px-5 pt-10 pb-24 sm:px-10 lg:grid-cols-12 lg:gap-20 lg:px-24 lg:pt-20 lg:pb-32"
    >
      <div className="flex flex-col gap-7 lg:col-span-6 lg:col-start-7 lg:gap-9">
        <p
          className="apparition text-[0.6875rem] tracking-[0.46em] text-glow uppercase sm:text-[0.8125rem]"
          style={delay(0)}
        >
          {siteConfig.artist} · {release.format}
        </p>
        <h1
          id="titre-ep-page"
          className="apparition-titre origin-left font-display text-[clamp(3.25rem,17vw,4.5rem)] leading-[0.9] font-light uppercase sm:text-8xl lg:text-9xl"
          style={delay(0.3)}
        >
          {/* Nom officiel en un seul bloc pour les lecteurs d'écran, sur deux lignes à l'écran. */}
          <span className="sr-only">{siteConfig.project}</span>
          <span aria-hidden="true" className="block">
            Matière
          </span>
          <span aria-hidden="true" className="block">
            Noire
          </span>
        </h1>

        <dl
          className="apparition grid grid-cols-2 gap-x-6 gap-y-5 border-y border-cosmic/50 py-6"
          style={delay(1.2)}
        >
          <Fact label="Artiste">{siteConfig.artist}</Fact>
          <Fact label="Format">{release.format}</Fact>
          <Fact label="Sortie">
            {releaseDate ? formatReleaseDate(releaseDate) : <PlaceholderPill label="date" />}
          </Fact>
          <Fact label="Titres">
            {tracks.length > 0 ? tracks.length : <PlaceholderPill label="liste" />}
          </Fact>
        </dl>

        <div className="apparition flex flex-col gap-3 sm:flex-row sm:gap-4" style={delay(1.5)}>
          <a
            href="#ecouter"
            className="inline-flex min-h-14 items-center justify-center rounded-full bg-star px-8 text-[0.8125rem] font-semibold tracking-[0.16em] text-void uppercase transition-colors hover:bg-glow"
          >
            Écouter l’EP
          </a>
          <a
            href="#titres"
            className="inline-flex min-h-14 items-center justify-center rounded-full border border-star/35 px-8 text-[0.8125rem] font-medium tracking-[0.16em] uppercase transition-colors hover:border-glow hover:text-glow"
          >
            Voir les titres
          </a>
        </div>
      </div>

      {/* Sur ordinateur, la pochette passe à gauche ; elle reste après le titre dans l'ordre de lecture. */}
      <CoverArt
        sizes="(min-width: 1024px) 45vw, 100vw"
        priority
        className="lg:col-span-6 lg:col-start-1 lg:row-start-1"
      />
    </section>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <dt className="text-[0.6875rem] tracking-[0.3em] text-star/60 uppercase">{label}</dt>
      <dd className="font-display text-2xl leading-tight">{children}</dd>
    </div>
  );
}
