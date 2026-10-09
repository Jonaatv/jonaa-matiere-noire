import { ListenLinks } from "@/components/release/ListenLinks";
import { Section } from "@/components/ui/Section";

/** Accueil — liens d'écoute officiels. */
export function ListenSection() {
  return (
    <Section
      id="ecouter"
      number="01"
      eyebrow="Écouter"
      title="Écouter l’EP"
      intro="Liens officiels uniquement. Chaque lien s’ouvre sur la plateforme, dans un nouvel onglet."
    >
      <ListenLinks />
    </Section>
  );
}
