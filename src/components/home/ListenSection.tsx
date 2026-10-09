import { ExternalLink } from "@/components/ui/ExternalLink";
import { Placeholder } from "@/components/ui/Placeholder";
import { release } from "@/config/release";

import { Section } from "./Section";

/**
 * Liens d'écoute officiels.
 * Un clic ouvre la plateforme : ce n'est pas une écoute comptabilisée.
 */
export function ListenSection() {
  const { listenLinks } = release;

  return (
    <Section
      id="ecouter"
      number="01"
      eyebrow="Écouter"
      title="Écouter l’EP"
      intro="Liens officiels uniquement. Chaque lien s’ouvre sur la plateforme, dans un nouvel onglet."
    >
      {listenLinks.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          {listenLinks.map((link) => (
            <li key={link.url}>
              <ExternalLink
                href={link.url}
                className="flex min-h-16 items-center justify-between gap-4 rounded-sm border border-cosmic/70 bg-night/60 px-5 text-[0.9375rem] transition-colors hover:border-glow hover:text-glow sm:min-h-19 sm:px-7 sm:text-base"
              >
                <span className="mr-auto">{link.platform}</span>
              </ExternalLink>
            </li>
          ))}
        </ul>
      ) : (
        <Placeholder
          title="Liens d’écoute officiels"
          description="Les plateformes et leurs liens officiels s’afficheront ici une fois fournis et vérifiés."
        />
      )}

      {/* Lecteur intégré : sera ajouté une fois la plateforme officielle connue, chargé au clic. */}
      <div className="flex flex-col gap-4 rounded-sm border border-cosmic/60 bg-night/70 p-7 sm:flex-row sm:items-center sm:justify-between sm:gap-10 sm:p-10">
        <div className="flex flex-col gap-2.5">
          <p className="text-[0.6875rem] tracking-[0.28em] text-glow uppercase">
            Lecteur intégré officiel · à fournir
          </p>
          <p className="max-w-md text-sm leading-relaxed text-star/72 sm:text-[0.9375rem]">
            Le lecteur de la plateforme (contenu tiers) ne se chargera qu’après votre clic.
          </p>
        </div>
        <button
          type="button"
          disabled
          className="min-h-13 shrink-0 cursor-not-allowed rounded-full border border-star/30 px-7 text-xs tracking-[0.16em] whitespace-nowrap text-star/60 uppercase"
        >
          Charger le lecteur
        </button>
      </div>
    </Section>
  );
}
