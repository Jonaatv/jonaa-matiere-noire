import type { Metadata } from "next";
import Link from "next/link";

import { EpHero } from "@/components/ep/EpHero";
import { ClipList } from "@/components/release/ClipList";
import { ListenLinks } from "@/components/release/ListenLinks";
import { Tracklist } from "@/components/release/Tracklist";
import { Placeholder } from "@/components/ui/Placeholder";
import { Section } from "@/components/ui/Section";
import { release } from "@/config/release";
import { siteConfig } from "@/config/site";

const title = `${siteConfig.project} — L’EP de ${siteConfig.artist}`;
const description = `Page officielle de l’EP ${siteConfig.project} de ${siteConfig.artist}.`;

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, locale: siteConfig.locale, type: "website" },
};

/**
 * Page de présentation de l'EP. Tous les contenus viennent de
 * `src/config/release.ts` ; ceux qui manquent restent des emplacements
 * « À fournir » clairement identifiés.
 */
export default function EpPage() {
  const { description: presentation, credits } = release;

  return (
    <>
      <EpHero />

      <Section
        id="titres"
        number="01"
        eyebrow="Titres"
        title="Les titres"
        intro="Dans l’ordre de l’EP."
      >
        <Tracklist />
      </Section>

      <Section
        id="ecouter"
        number="02"
        eyebrow="Écouter"
        title="Écouter l’EP"
        intro="Liens officiels uniquement. Chaque lien s’ouvre sur la plateforme, dans un nouvel onglet."
      >
        <ListenLinks />
      </Section>

      <Section id="clips" number="03" eyebrow="Clips" title="Clips">
        <ClipList />
      </Section>

      <Section id="a-propos" number="04" eyebrow="À propos" title="Présentation">
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          {presentation ? (
            <p className="text-base leading-relaxed text-star/80 sm:col-span-2">{presentation}</p>
          ) : (
            <Placeholder
              title="Texte de présentation"
              tag="facultatif"
              description="Quelques lignes de JONAA sur l’EP."
            />
          )}
          {credits.length > 0 ? (
            <div className="flex flex-col gap-4">
              <h3 className="text-[0.6875rem] tracking-[0.3em] text-glow uppercase">Crédits</h3>
              <ul className="flex flex-col gap-2 text-[0.9375rem] leading-relaxed text-star/75">
                {credits.map((credit) => (
                  <li key={credit}>{credit}</li>
                ))}
              </ul>
            </div>
          ) : (
            <Placeholder
              title="Crédits"
              description="Production, mix, mastering, pochette : à compléter avec les crédits confirmés."
            />
          )}
        </div>
      </Section>

      <nav
        aria-label="Suite de la visite"
        className="flex justify-center border-t border-cosmic/45 px-5 py-16 sm:px-10 lg:py-24"
      >
        <Link
          href="/"
          className="inline-flex min-h-14 items-center justify-center rounded-full border border-star/35 px-8 text-[0.8125rem] font-medium tracking-[0.16em] uppercase transition-colors hover:border-glow hover:text-glow"
        >
          Retour à l’accueil
        </Link>
      </nav>
    </>
  );
}
