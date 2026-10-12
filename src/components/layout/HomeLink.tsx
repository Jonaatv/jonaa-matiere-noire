import Link from "next/link";

import { siteConfig } from "@/config/site";

/** Lien discret de retour à l'accueil, en haut des pages d'expérience. */
export function HomeLink({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex min-h-11 items-center gap-2 self-start text-xs tracking-[0.3em] text-star/70 uppercase transition-colors hover:text-glow ${className}`}
    >
      <span aria-hidden="true">←</span>
      {siteConfig.artist} — Accueil
    </Link>
  );
}
