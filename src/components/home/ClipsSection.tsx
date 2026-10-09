import { ClipList } from "@/components/release/ClipList";
import { Section } from "@/components/ui/Section";

/** Accueil — clips officiels. */
export function ClipsSection() {
  return (
    <Section id="clips" number="03" eyebrow="Clips" title="Clips">
      <ClipList />
    </Section>
  );
}
