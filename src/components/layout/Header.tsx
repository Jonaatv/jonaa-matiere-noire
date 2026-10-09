import Link from "next/link";

import { siteConfig } from "@/config/site";

/** En-tête — la navigation par sections sera ajoutée avec les sections elles-mêmes. */
export function Header() {
  return (
    <header className="px-4 py-5 sm:px-8">
      <Link
        href="/"
        className="text-sm font-semibold tracking-[0.3em]"
        aria-label={`${siteConfig.artist} — accueil`}
      >
        {siteConfig.artist}
      </Link>
    </header>
  );
}
