"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavLinkProps = {
  href: string;
  children: ReactNode;
};

/**
 * Lien de l'en-tête. Signale la page en cours (`aria-current="page"`) aux
 * lecteurs d'écran et la souligne d'un filet bleu.
 */
export function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const current = !href.includes("#") && pathname === href;

  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className="inline-flex min-h-11 items-center text-star/75 transition-colors hover:text-glow aria-[current=page]:text-star aria-[current=page]:underline aria-[current=page]:decoration-glow aria-[current=page]:underline-offset-8"
    >
      {children}
    </Link>
  );
}
