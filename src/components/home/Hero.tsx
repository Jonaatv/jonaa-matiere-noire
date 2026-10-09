import Image from "next/image";

import { Placeholder, PlaceholderPill } from "@/components/ui/Placeholder";
import { formatReleaseDate, release } from "@/config/release";
import { siteConfig } from "@/config/site";

/** Premier écran : JONAA, le titre MATIÈRE NOIRE, la pochette et l'accès à l'écoute. */
export function Hero() {
  const { cover, releaseDate } = release;

  return (
    <section
      id="accueil"
      aria-labelledby="titre-principal"
      className="grid grid-cols-1 items-center gap-12 px-5 pt-14 pb-24 sm:px-10 lg:grid-cols-12 lg:gap-20 lg:px-24 lg:pt-24 lg:pb-36"
    >
      <div className="flex flex-col gap-7 lg:col-span-7 lg:gap-10">
        <p className="text-[0.6875rem] tracking-[0.46em] text-glow uppercase sm:text-[0.8125rem]">
          {siteConfig.artist} · {release.format}
        </p>
        <h1
          id="titre-principal"
          className="font-display text-[clamp(3.5rem,19vw,4.75rem)] leading-[0.88] font-light uppercase sm:text-9xl lg:text-[10.5rem] lg:leading-[0.86]"
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
        <div className="flex items-center gap-4">
          <span aria-hidden="true" className="h-px w-8 bg-glow/50 lg:w-12" />
          {releaseDate ? (
            <p className="text-xs tracking-[0.18em] text-glow uppercase">
              Sortie le {formatReleaseDate(releaseDate)}
            </p>
          ) : (
            <PlaceholderPill label="date de sortie" />
          )}
        </div>
        <div className="mt-2 hidden flex-wrap gap-4 lg:flex">
          <HeroActions />
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

      {/* Sur mobile, les boutons viennent après la pochette. */}
      <div className="flex flex-col gap-3 lg:hidden">
        <HeroActions />
      </div>
    </section>
  );
}

function HeroActions() {
  return (
    <>
      <a
        href="#ecouter"
        className="inline-flex min-h-14 items-center justify-center rounded-full bg-star px-8 text-[0.8125rem] font-semibold tracking-[0.16em] text-void uppercase transition-colors hover:bg-glow"
      >
        Écouter l’EP
      </a>
      <a
        href="#ep"
        className="inline-flex min-h-14 items-center justify-center rounded-full border border-star/35 px-8 text-[0.8125rem] font-medium tracking-[0.16em] uppercase transition-colors hover:border-glow hover:text-glow"
      >
        Découvrir l’EP
      </a>
    </>
  );
}
