import Link from "next/link";

import { siteConfig } from "@/config/site";

const navigation = [
  { href: "/#projet", label: "Le projet" },
  { href: "/#ecouter", label: "Écouter" },
];

/** En-tête transparent, posé sur le premier écran. */
export function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-4 px-4 py-4 sm:px-8 sm:py-6">
      <Link
        href="/"
        className="flex min-h-11 items-center text-sm font-semibold tracking-[0.35em]"
        aria-label={`${siteConfig.artist} — accueil`}
      >
        {siteConfig.artist}
      </Link>
      <nav aria-label="Navigation principale">
        <ul className="flex items-center gap-1 sm:gap-4">
          {navigation.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex min-h-11 items-center px-2 text-[0.7rem] font-medium tracking-[0.25em] text-star/75 uppercase transition-colors hover:text-star"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
