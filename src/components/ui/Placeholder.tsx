/**
 * Emplacement temporaire pour un contenu officiel pas encore fourni.
 * Toujours marqué « À fournir » : il ne doit jamais passer pour un vrai contenu.
 */

type PlaceholderProps = {
  /** Nom du contenu attendu, ex. « Liste des titres ». */
  title: string;
  /** Précision facultative sous le titre. */
  description?: string;
  /** Complément de l'étiquette, ex. « facultatif ». */
  tag?: string;
  className?: string;
};

export function Placeholder({ title, description, tag, className = "" }: PlaceholderProps) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-sm border border-dashed border-glow/40 bg-night/55 p-7 sm:p-9 ${className}`}
    >
      <PlaceholderTag tag={tag} />
      <p className="font-display text-[1.75rem] leading-tight sm:text-[2rem]">{title}</p>
      {description ? (
        <p className="max-w-md text-[0.9375rem] leading-relaxed text-star/70">{description}</p>
      ) : null}
    </div>
  );
}

/** Version compacte (une ligne), pour un libellé dans le texte. */
export function PlaceholderPill({ label, className = "" }: { label: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-dashed border-glow/40 bg-night/55 px-3.5 py-2 text-[0.6875rem] tracking-[0.18em] text-glow uppercase sm:text-xs ${className}`}
    >
      À fournir · {label}
    </span>
  );
}

function PlaceholderTag({ tag }: { tag?: string }) {
  return (
    <span className="text-[0.6875rem] tracking-[0.3em] text-glow uppercase">
      À fournir{tag ? ` · ${tag}` : ""}
    </span>
  );
}
