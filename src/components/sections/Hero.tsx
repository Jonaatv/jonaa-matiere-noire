import { ButtonLink } from "@/components/ui/ButtonLink";
import { siteConfig } from "@/config/site";

/** Premier écran : JONAA, MATIÈRE NOIRE et les deux appels à l'action. */
export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-4 pt-28 pb-36 text-center"
    >
      {/* Horizon planétaire, décoratif, en bas de l'écran. */}
      <div
        aria-hidden="true"
        className="horizon pointer-events-none absolute top-[calc(100%-7rem)] left-1/2 -translate-x-1/2"
      />

      <h1 id="hero-title" className="relative flex flex-col items-center">
        <span
          className="reveal pl-[0.6em] text-xs font-medium tracking-[0.6em] text-glow uppercase sm:text-sm"
          style={{ animationDelay: "200ms" }}
        >
          {siteConfig.artist}
        </span>
        <span className="sr-only"> — </span>
        <span
          className="reveal mt-6 bg-linear-to-b from-white via-star to-glow/70 bg-clip-text pb-2 font-display text-[clamp(3.5rem,17vw,6rem)] leading-[0.92] font-light tracking-[0.06em] text-transparent uppercase drop-shadow-[0_0_35px_rgb(157_184_255/0.25)] md:text-[clamp(5rem,8.5vw,9rem)]"
          style={{ animationDelay: "450ms" }}
        >
          <span className="block md:inline">Matière</span>{" "}
          <span className="block md:inline">Noire</span>
        </span>
      </h1>

      <p
        className="reveal mt-8 flex items-center gap-4 text-[0.7rem] font-medium tracking-[0.5em] text-star/75 uppercase"
        style={{ animationDelay: "750ms" }}
      >
        <span aria-hidden="true" className="h-px w-10 bg-linear-to-r from-transparent to-glow/60" />
        <span className="pl-[0.5em]">EP</span>
        <span aria-hidden="true" className="h-px w-10 bg-linear-to-l from-transparent to-glow/60" />
      </p>

      {siteConfig.tagline ? (
        <p
          className="reveal mt-6 max-w-md font-display text-xl text-star/85 italic sm:text-2xl"
          style={{ animationDelay: "900ms" }}
        >
          {siteConfig.tagline}
        </p>
      ) : null}

      <div
        className="reveal mt-12 flex w-full max-w-xs flex-col gap-4 sm:w-auto sm:max-w-none sm:flex-row"
        style={{ animationDelay: "1050ms" }}
      >
        <ButtonLink href="#ecouter" variant="primary">
          <svg aria-hidden="true" viewBox="0 0 12 14" className="size-3 fill-current">
            <path d="M0 0v14l12-7z" />
          </svg>
          Écouter l’EP
        </ButtonLink>
        <ButtonLink href="#projet" variant="secondary">
          Découvrir le projet
        </ButtonLink>
      </div>

      {/* Invitation à faire défiler, décorative. */}
      <div
        aria-hidden="true"
        className="reveal absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3"
        style={{ animationDelay: "1600ms" }}
      >
        <span className="text-[0.6rem] tracking-[0.4em] text-star/50 uppercase">Défiler</span>
        <span className="relative h-10 w-px overflow-hidden bg-star/10">
          <span className="scroll-cue absolute inset-0 bg-glow/80" />
        </span>
      </div>
    </section>
  );
}
