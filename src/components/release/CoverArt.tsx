import Image from "next/image";

import { Placeholder } from "@/components/ui/Placeholder";
import { release } from "@/config/release";
import { siteConfig } from "@/config/site";

type CoverArtProps = {
  /** Tailles d'affichage de l'image, pour le chargement responsive. */
  sizes: string;
  /** Pochette visible dès le premier écran : chargée en priorité. */
  priority?: boolean;
  className?: string;
};

/**
 * Pochette de l'EP, ou son emplacement tant que la pochette définitive
 * n'existe pas. La pochette officielle est affichée telle quelle :
 * aucune retouche, aucun élément superposé.
 */
export function CoverArt({ sizes, priority = false, className = "" }: CoverArtProps) {
  const { cover } = release;

  return (
    <figure className={`flex flex-col gap-4 lg:gap-5 ${className}`}>
      {cover ? (
        <Image
          src={cover.src}
          alt={cover.alt}
          width={cover.width}
          height={cover.height}
          sizes={sizes}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          className="h-auto w-full shadow-[0_40px_120px_rgb(37_59_133/0.28)]"
        />
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
