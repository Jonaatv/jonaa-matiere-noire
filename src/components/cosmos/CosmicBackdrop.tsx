import { Starfield } from "./Starfield";

/**
 * Décor spatial fixe derrière tout le site :
 * ciel bleu nuit, nébuleuses en dérive lente, étoiles, grain et vignettage.
 * Purement décoratif : ignoré par les lecteurs d'écran.
 */
export function CosmicBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="cosmos-sky pointer-events-none fixed inset-x-0 top-0 z-0 h-lvh overflow-hidden"
    >
      <div className="nebula nebula--far" />
      <div className="nebula nebula--near" />
      <Starfield />
      <div className="film-grain absolute inset-0" />
      <div className="vignette absolute inset-0" />
    </div>
  );
}
