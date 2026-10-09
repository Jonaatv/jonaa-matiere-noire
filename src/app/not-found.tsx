import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-[0.1em]">Page introuvable</h1>
      <p className="mt-4 text-star/70">Cette page s’est perdue dans le vide.</p>
      <Link
        href="/"
        className="mt-8 inline-flex min-h-11 items-center rounded-full border border-cosmic px-6 hover:border-glow"
      >
        Retour à l’accueil
      </Link>
    </section>
  );
}
