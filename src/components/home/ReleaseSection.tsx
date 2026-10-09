import { Placeholder } from "@/components/ui/Placeholder";
import { release } from "@/config/release";

import { Section } from "./Section";

/** L'EP : liste officielle des titres et présentation facultative. */
export function ReleaseSection() {
  const { tracks, description } = release;

  return (
    <Section
      id="ep"
      number="02"
      eyebrow="L’EP"
      title={
        <>
          Matière <br className="hidden lg:inline" />
          Noire
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        {tracks.length > 0 ? (
          <div className="flex flex-col gap-5 rounded-sm border border-cosmic/60 bg-night/60 p-7 sm:p-9">
            <h3 className="text-[0.6875rem] tracking-[0.3em] text-glow uppercase">Titres</h3>
            <ol className="flex flex-col">
              {tracks.map((track, index) => (
                <li
                  key={`${index}-${track.title}`}
                  className="flex items-baseline gap-5 border-b border-cosmic/40 py-3.5 last:border-b-0"
                >
                  <span className="w-6 text-xs text-star/60 tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="font-display text-2xl">{track.title}</span>
                  {track.note ? <span className="text-sm text-star/60">{track.note}</span> : null}
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <Placeholder
            title="Liste des titres"
            description="Titres officiels, dans l’ordre de l’EP. Aucun titre n’est affiché avant validation."
            className="sm:min-h-70"
          />
        )}

        {description ? (
          <div className="flex flex-col gap-5 rounded-sm border border-cosmic/60 bg-night/60 p-7 sm:p-9">
            <h3 className="text-[0.6875rem] tracking-[0.3em] text-glow uppercase">Présentation</h3>
            <p className="text-base leading-relaxed text-star/80">{description}</p>
          </div>
        ) : (
          <Placeholder
            title="Présentation"
            tag="facultatif"
            description="Court texte sur l’EP et crédits."
            className="sm:min-h-70"
          />
        )}
      </div>
    </Section>
  );
}
