import { siteConfig } from "@/config/site";

/**
 * Page d'accueil — squelette technique.
 * Le premier écran immersif (étoiles, nébuleuses, pochette, boutons d'écoute)
 * sera construit à l'étape design, après validation.
 */
export default function HomePage() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-sm tracking-[0.4em] text-glow uppercase">{siteConfig.artist}</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-[0.15em] sm:text-6xl">
        {siteConfig.project}
      </h1>
      <p className="mt-8 text-sm text-star/70">Site en construction.</p>
    </section>
  );
}
