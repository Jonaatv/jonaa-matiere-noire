import { Placeholder } from "@/components/ui/Placeholder";
import { release } from "@/config/release";
import { siteConfig } from "@/config/site";

type CoverArtProps = {
  /** Largeur d'affichage selon l'écran (attribut `sizes`), pour choisir la bonne version. */
  sizes: string;
  /** Pochette visible dès le premier écran : chargée en priorité. */
  priority?: boolean;
  className?: string;
};

/**
 * Pochette de l'EP, ou son emplacement tant qu'elle n'est pas renseignée.
 *
 * La pochette officielle est affichée telle quelle : aucune retouche, aucun
 * élément superposé, aucun effet. Le navigateur choisit la version WebP
 * adaptée à l'écran ; le PNG original sert de secours.
 */
export function CoverArt({ sizes, priority = false, className = "" }: CoverArtProps) {
  const { cover } = release;

  return (
    <figure className={`flex flex-col gap-4 lg:gap-5 ${className}`}>
      {cover ? (
        <picture>
          <source
            type="image/webp"
            srcSet={cover.webp.map((version) => `${version.src} ${version.width}w`).join(", ")}
            sizes={sizes}
          />
          {/*
            <img> plutôt que next/image : en export statique, next/image ne
            produit pas de variantes ; <picture> sert les WebP pré-générés.
          */}
          <img
            src={cover.src}
            alt={cover.alt}
            width={cover.width}
            height={cover.height}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            className="aspect-square h-auto w-full"
          />
        </picture>
      ) : (
        <Placeholder
          title="Pochette définitive"
          tag="en cours de création"
          description="Emplacement temporaire. Le fichier officiel sera affiché tel quel, sans retouche ni élément ajouté."
          className="aspect-square items-center justify-center text-center shadow-[0_40px_120px_rgb(37_59_133/0.28)]"
        />
      )}
      <figcaption className="text-[0.6875rem] tracking-[0.24em] text-star/60 uppercase sm:text-xs">
        {siteConfig.artist} — {siteConfig.project}
      </figcaption>
    </figure>
  );
}
