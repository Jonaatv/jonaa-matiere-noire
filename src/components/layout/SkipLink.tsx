/** Lien « Aller au contenu », visible uniquement au clavier, pour l'accessibilité. */
export function SkipLink() {
  return (
    <a
      href="#contenu"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-star focus:px-4 focus:py-2 focus:text-void"
    >
      Aller au contenu
    </a>
  );
}
