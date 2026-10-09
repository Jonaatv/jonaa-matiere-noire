import Link from "next/link";

import { Tracklist } from "@/components/release/Tracklist";
import { Section } from "@/components/ui/Section";

/** Accueil — aperçu de l'EP : liste des titres et accès à la page complète. */
export function ReleaseSection() {
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
      <Tracklist />
      <Link
        href="/ep"
        className="inline-flex min-h-14 items-center justify-center self-start rounded-full border border-star/35 px-8 text-[0.8125rem] font-medium tracking-[0.16em] uppercase transition-colors hover:border-glow hover:text-glow"
      >
        Découvrir l’EP
      </Link>
    </Section>
  );
}
