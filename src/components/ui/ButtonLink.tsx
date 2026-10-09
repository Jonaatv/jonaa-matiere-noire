import Link from "next/link";
import type { ComponentProps } from "react";

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: "primary" | "secondary";
};

const base =
  "inline-flex min-h-12 items-center justify-center gap-3 rounded-full px-8 text-xs font-semibold tracking-[0.25em] uppercase transition duration-300";

const variants = {
  primary:
    "bg-star text-void shadow-[0_0_40px_-8px_rgb(157_184_255/0.6)] hover:bg-white hover:shadow-[0_0_50px_-6px_rgb(157_184_255/0.85)]",
  secondary:
    "border border-star/25 bg-void/30 text-star hover:border-glow/70 hover:bg-night/60 hover:text-white",
};

/** Lien présenté comme un bouton (grande zone tactile, au moins 48 px de haut). */
export function ButtonLink({ variant = "primary", className = "", ...props }: ButtonLinkProps) {
  return <Link className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
