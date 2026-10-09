import type { ReactNode } from "react";

type SectionFrameProps = {
  id: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
};

/** Cadre commun des sections : sur-titre, titre et contenu, sur un panneau bleu nuit. */
export function SectionFrame({ id, eyebrow, title, children }: SectionFrameProps) {
  const titleId = `${id}-titre`;

  return (
    <section id={id} aria-labelledby={titleId} className="scroll-mt-8 px-4 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-3xl rounded-3xl border border-star/10 bg-night/55 px-6 py-14 text-center shadow-[0_0_80px_-30px_rgb(37_59_133/0.6)] sm:px-12">
        <p className="pl-[0.5em] text-[0.7rem] font-medium tracking-[0.5em] text-glow uppercase">
          {eyebrow}
        </p>
        <h2
          id={titleId}
          className="mt-5 font-display text-4xl font-light tracking-[0.06em] uppercase sm:text-5xl"
        >
          {title}
        </h2>
        <div className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-star/75">
          {children}
        </div>
      </div>
    </section>
  );
}
