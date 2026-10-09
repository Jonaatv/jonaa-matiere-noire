import { ExternalLink } from "@/components/ui/ExternalLink";
import { Placeholder } from "@/components/ui/Placeholder";
import { release } from "@/config/release";

/**
 * Clips officiels : liens vers la vidéo sur la plateforme officielle.
 * Un lecteur vidéo intégré éventuel ne se chargera qu'au clic du visiteur.
 */
export function ClipList() {
  const { clips } = release;

  if (clips.length === 0) {
    return (
      <Placeholder
        title="Clips officiels"
        description="Les vidéos officielles s’afficheront ici. Un lecteur vidéo ne se chargera qu’après votre clic."
      />
    );
  }

  return (
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
  );
}
