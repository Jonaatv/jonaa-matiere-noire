import type { ReactNode } from "react";

type ExternalLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

/**
 * Lien vers un site externe officiel (plateforme, réseau, vidéo).
 * S'ouvre dans un nouvel onglet ; les lecteurs d'écran en sont prévenus.
 */
export function ExternalLink({ href, children, className = "" }: ExternalLinkProps) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
      <span className="sr-only"> (nouvel onglet)</span>
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 16 16"
        className="size-3.5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      >
        <path d="M5 11 11 5M6 5h5v5" />
      </svg>
    </a>
  );
}
