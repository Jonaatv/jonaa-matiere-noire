import { Placeholder } from "@/components/ui/Placeholder";
import { release } from "@/config/release";

/**
 * Liste des titres de l'EP, dans l'ordre officiel.
 * Évolutive : il suffit d'ajouter les titres confirmés dans `release.ts`
 * (titre, puis mention et durée facultatives). Tant qu'elle est vide,
 * un emplacement « À fournir » s'affiche : aucun titre n'est inventé.
 */
export function Tracklist({ className = "" }: { className?: string }) {
  const { tracks } = release;

  if (tracks.length === 0) {
    return (
      <Placeholder
        title="Liste des titres"
        description="Les titres confirmés s’afficheront ici, dans l’ordre de l’EP. Aucun titre n’est affiché avant validation."
        className={className}
      />
    );
  }

  return (
    <ol
      aria-label={`Titres de l’EP (${tracks.length})`}
      className={`flex flex-col border-t border-cosmic/50 ${className}`}
    >
      {tracks.map((track, index) => (
        <li
          key={`${index}-${track.title}`}
          className="grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-baseline gap-x-3 border-b border-cosmic/50 py-5 sm:grid-cols-[3rem_minmax(0,1fr)_auto] sm:gap-x-5"
        >
          <span className="text-xs tracking-[0.2em] text-star/60 tabular-nums">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="flex min-w-0 flex-col gap-1">
            <span className="font-display text-2xl leading-tight break-words sm:text-[1.75rem]">
              {track.title}
            </span>
            {track.note ? <span className="text-sm text-star/65">{track.note}</span> : null}
          </span>
          {track.duration ? (
            <span className="text-sm text-star/65 tabular-nums">
              <span className="sr-only">Durée : </span>
              {track.duration}
            </span>
          ) : (
            <span />
          )}
        </li>
      ))}
    </ol>
  );
}
