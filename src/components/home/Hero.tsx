import type { CSSProperties } from "react";
import Image from "next/image";

import { Placeholder, PlaceholderPill } from "@/components/ui/Placeholder";
import { formatReleaseDate, release } from "@/config/release";
import { siteConfig } from "@/config/site";

/** Délai de l'apparition en fondu (voir `.apparition` dans globals.css). */
const delay = (seconds: number) => ({ "--delai": `${seconds}s` }) as CSSProperties;

/**
 * Premier écran : JONAA, le titre MATIÈRE NOIRE, la pochette et l'accès à l'écoute.
 *
 * Mobile : carton de titre plein écran (titre + « Écouter l'EP »), la pochette
 * juste en dessous, puis « Découvrir l'EP ». Ordinateur : deux colonnes, les
 * deux boutons côte à côte sous le titre.
 */
export function Hero() {
  const { cover, releaseDate } = release;

  return (
    <section
      id="accueil"
      aria-labelledby="titre-principal"
      className="grid grid-cols-1 items-center gap-12 px-5 pb-24 sm:px-10 lg:grid-cols-12 lg:gap-20 lg:px-24 lg:pt-24 lg:pb-36"
    >
      {/* Carton de titre : toute la hauteur de l'écran sous l'en-tête, sur mobile. */}
      <div className="flex min-h-[calc(100svh-var(--hauteur-entete-mobile))] flex-col lg:col-span-7 lg:min-h-0">
        <div className="flex flex-1 flex-col justify-center gap-7 py-10 lg:gap-10 lg:py-0">
          <p
            className="apparition text-[0.6875rem] tracking-[0.46em] text-glow uppercase sm:text-[0.8125rem]"
            style={delay(0)}
          >
            {siteConfig.artist} · {release.format}
          </p>
          <h1
            id="titre-principal"
            className="apparition-titre origin-left font-display text-[clamp(3.5rem,19vw,4.75rem)] leading-[0.88] font-light uppercase sm:text-9xl lg:text-[10.5rem] lg:leading-[0.86]"
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
          <div className="apparition flex items-center gap-4" style={delay(1.2)}>
            {/* Filet décoratif masqué sous 360 px pour garder l'étiquette sur une ligne. */}
            <span aria-hidden="true" className="hidden h-px w-8 bg-glow/50 min-[360px]:block lg:w-12" />
            {releaseDate ? (
              <p className="text-xs tracking-[0.18em] text-glow uppercase">
                Sortie le {formatReleaseDate(releaseDate)}
              </p>
            ) : (
              <PlaceholderPill label="date de sortie" />
            )}
          </div>
          <div className="apparition mt-2 flex flex-wrap gap-4" style={delay(1.5)}>
            <ListenButton className="w-full sm:w-auto" />
            <div className="hidden lg:block">
              <DiscoverButton />
            </div>
          </div>
        </div>

        {/* Indicateur de défilement, décoratif, sur mobile uniquement. */}
        <div
          aria-hidden="true"
          className="apparition flex flex-col items-center gap-2 pb-6 lg:hidden"
          style={delay(2.2)}
        >
          <span className="text-[0.625rem] tracking-[0.4em] text-star/60 uppercase">Défiler</span>
          <span className="indicateur-defilement block h-8 w-px bg-linear-to-b from-glow/70 to-transparent" />
        </div>
      </div>

      <figure className="flex flex-col gap-4 lg:col-span-5 lg:gap-5">
        {cover ? (
          // Pochette officielle affichée telle quelle : aucun élément superposé.
          <Image
            src={cover.src}
            alt={cover.alt}
            width={cover.width}
            height={cover.height}
            loading="eager"
            fetchPriority="high"
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="h-auto w-full shadow-[0_40px_120px_rgb(37_59_133/0.28)]"
          />
        ) : (
          <Placeholder
            title="Pochette officielle"
            description="Emplacement temporaire. Le fichier officiel sera affiché tel quel, sans retouche ni élément ajouté."
            className="aspect-square items-center justify-center text-center shadow-[0_40px_120px_rgb(37_59_133/0.28)]"
          />
        )}
        <figcaption className="text-[0.6875rem] tracking-[0.24em] text-star/60 uppercase sm:text-xs">
          {siteConfig.artist} — {siteConfig.project}
        </figcaption>
      </figure>

      {/* Sur mobile, « Découvrir l'EP » vient après la pochette. */}
      <div className="lg:hidden">
        <DiscoverButton className="w-full" />
      </div>
    </section>
  );
}

const buttonBase =
  "inline-flex min-h-14 items-center justify-center rounded-full px-8 text-[0.8125rem] tracking-[0.16em] uppercase transition-colors";

function ListenButton({ className = "" }: { className?: string }) {
  return (
    <a
      href="#ecouter"
      className={`${buttonBase} bg-star font-semibold text-void hover:bg-glow ${className}`}
    >
      Écouter l’EP
    </a>
  );
}

function DiscoverButton({ className = "" }: { className?: string }) {
  return (
    <a
      href="#ep"
      className={`${buttonBase} border border-star/35 font-medium hover:border-glow hover:text-glow ${className}`}
    >
      Découvrir l’EP
    </a>
  );
}
