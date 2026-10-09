import type { ReactNode } from "react";

type SectionProps = {
  /** Ancre de la section (cible des liens de navigation). */
  id: string;
  /** Numéro affiché devant le surtitre, ex. « 01 ». */
  number: string;
  /** Surtitre, ex. « Écouter ». */
  eyebrow: string;
  title: ReactNode;
  /** Texte d'introduction facultatif sous le titre. */
  intro?: string;
  /** `split` : titre à gauche, contenu à droite sur grand écran. `center` : tout centré. */
  layout?: "split" | "center";
  children: ReactNode;
};

/** Section de la page d'accueil, séparée de la précédente par un filet bleu nuit. */
export function Section({
  id,
  number,
  eyebrow,
  title,
  intro,
  layout = "split",
  children,
}: SectionProps) {
  const titleId = `titre-${id}`;
  const centered = layout === "center";

  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={
        centered
          ? "flex flex-col items-center gap-7 border-t border-cosmic/45 px-5 py-20 text-center sm:px-10 lg:px-24 lg:py-30"
          : "grid grid-cols-1 gap-10 border-t border-cosmic/45 px-5 py-20 sm:px-10 lg:grid-cols-12 lg:gap-20 lg:px-24 lg:py-30"
      }
    >
      <header className={centered ? "flex flex-col items-center gap-6" : "flex flex-col gap-6 lg:col-span-4"}>
        <p className="text-[0.6875rem] tracking-[0.38em] text-glow uppercase sm:text-xs">
          {number} — {eyebrow}
        </p>
        <h2
          id={titleId}
          className="font-display text-[3.25rem] leading-[0.95] font-light lg:text-7xl"
        >
          {title}
        </h2>
        {intro ? (
          <p className="max-w-sm text-[0.9375rem] leading-relaxed text-star/70 sm:text-base">
            {intro}
          </p>
        ) : null}
      </header>
      <div className={centered ? "flex flex-col items-center gap-6" : "flex flex-col gap-8 lg:col-span-8"}>
        {children}
      </div>
    </section>
  );
}
