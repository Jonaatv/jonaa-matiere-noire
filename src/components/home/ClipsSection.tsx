import { ExternalLink } from "@/components/ui/ExternalLink";
import { Placeholder } from "@/components/ui/Placeholder";
import { release } from "@/config/release";

import { Section } from "./Section";

/**
 * Clips officiels.
 * Pour l'instant, de simples liens vers la vidéo officielle ; un lecteur
 * intégré éventuel ne se chargera qu'au clic du visiteur.
 */
export function ClipsSection() {
  const { clips } = release;

  return (
    <Section id="clips" number="03" eyebrow="Clips" title="Clips">
      {clips.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          {clips.map((clip) => (
            <li key={clip.url}>
              <ExternalLink
                href={clip.url}
                className="flex min-h-19 items-center justify-between gap-4 rounded-sm border border-cosmic/70 bg-night/60 px-5 font-display text-2xl transition-colors hover:border-glow hover:text-glow sm:px-7"
              >
                <span className="mr-auto">{clip.title}</span>
              </ExternalLink>
            </li>
          ))}
        </ul>
      ) : (
        <Placeholder
          title="Clips officiels"
          description="Les vidéos officielles s’afficheront ici. Un lecteur vidéo ne se chargera qu’après votre clic."
        />
      )}
    </Section>
  );
}
