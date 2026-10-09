import Link from "next/link";

import { siteConfig } from "@/config/site";

import { NavLink } from "./NavLink";

/** Sections de l'accueil et page de l'EP (les liens fonctionnent depuis toutes les pages). */
const navigation = [
  { href: "/#ecouter", label: "Écouter" },
  { href: "/ep", label: "L’EP" },
  { href: "/#clips", label: "Clips" },
  { href: "/#suivre", label: "Suivre" },
] as const;

export function Header() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 px-5 py-4 sm:px-10 lg:px-24 lg:py-8">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center text-[0.8125rem] font-semibold tracking-[0.36em] lg:text-sm lg:tracking-[0.42em]"
        aria-label={`${siteConfig.artist} — accueil`}
      >
        {siteConfig.artist}
      </Link>
      <nav aria-label="Navigation principale">
        <ul className="flex flex-wrap gap-x-4 text-[0.6875rem] tracking-[0.14em] uppercase sm:gap-x-8 lg:gap-x-12 lg:text-xs lg:tracking-[0.24em]">
          {navigation.map((item) => (
            <li key={item.href}>
              <NavLink href={item.href}>{item.label}</NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
