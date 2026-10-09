/**
 * Nébuleuse discrète, en CSS uniquement (voir `.nebuleuse` dans globals.css).
 *
 * Quelques nappes de dégradés bleu nuit, placées en haut de la page derrière
 * le premier écran : on les « quitte » en descendant, le noir reste dominant.
 * Ni image, ni WebGL, ni `filter: blur()`, ni animation : le calque est
 * dessiné une fois et ne coûte plus rien ensuite, y compris sur iPhone.
 */
export function Nebula() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[200svh] overflow-hidden"
    >
      <div className="nebuleuse" />
    </div>
  );
}

/**
 * Grain de film immobile et très léger, dans le fond uniquement : il passe
 * derrière le contenu (texte, boutons, pochette), jamais par-dessus.
 * La tuile de bruit est calculée une seule fois par le navigateur.
 */
export function FilmGrain() {
  return <div aria-hidden="true" className="grain pointer-events-none fixed inset-0 -z-10" />;
}
