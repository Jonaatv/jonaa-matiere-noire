/**
 * Espace profond de l'accueil : la nébuleuse inspirée de la pochette.
 *
 * Texture générée par `scripts/nebuleuse.py` (palette de la pochette
 * uniquement), affichée sur deux plans pour la profondeur : un plan proche
 * qui avance lentement vers nous, et le même ciel retourné, plus grand et
 * plus pâle, qui dérive plus lentement au loin (parallaxe). Seules la
 * position et l'échelle des calques changent (animation prise en charge
 * par le GPU) ; avec « réduire les animations », le ciel reste immobile.
 * Les étoiles et leurs traînées sont dessinées par-dessus (`WarpField`).
 */
export function DeepSpace() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-20 overflow-hidden bg-void"
    >
      <NebulaLayer className="espace-lointain opacity-35" />
      <NebulaLayer className="espace-proche opacity-90" />
    </div>
  );
}

function NebulaLayer({ className }: { className: string }) {
  return (
    <picture>
      <source media="(min-width: 768px)" srcSet="/images/cosmos/nebuleuse-1800.webp" />
      <img
        src="/images/cosmos/nebuleuse-1000.webp"
        alt=""
        width={1000}
        height={1000}
        decoding="async"
        className={`absolute top-[-10%] left-[-10%] h-[120%] w-[120%] max-w-none object-cover ${className}`}
      />
    </picture>
  );
}
