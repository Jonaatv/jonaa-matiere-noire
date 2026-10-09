import { ClipsSection } from "@/components/home/ClipsSection";
import { FollowSection } from "@/components/home/FollowSection";
import { Hero } from "@/components/home/Hero";
import { ListenSection } from "@/components/home/ListenSection";
import { ReleaseSection } from "@/components/home/ReleaseSection";

/**
 * Page d'accueil. Les contenus viennent de `src/config/release.ts` ;
 * tant qu'ils ne sont pas fournis, chaque section affiche un emplacement « À fournir ».
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <ListenSection />
      <ReleaseSection />
      <ClipsSection />
      <FollowSection />
    </>
  );
}
