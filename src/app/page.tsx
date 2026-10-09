import { Hero } from "@/components/sections/Hero";
import { SectionFrame } from "@/components/sections/SectionFrame";

/**
 * Page d'accueil.
 * Les sections « Le projet » et « Écouter » sont des emplacements :
 * leur contenu (présentation, liste des morceaux, liens d'écoute) sera
 * ajouté aux étapes suivantes, à partir des informations officielles.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <SectionFrame id="projet" eyebrow="Le projet" title="Matière Noire">
        <p>La présentation du projet sera publiée prochainement.</p>
      </SectionFrame>
      <SectionFrame id="ecouter" eyebrow="Écouter" title="Écouter l’EP">
        <p>Les liens d’écoute officiels seront ajoutés dès leur publication.</p>
      </SectionFrame>
    </>
  );
}
