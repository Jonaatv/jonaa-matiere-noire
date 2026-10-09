# JONAA — MATIÈRE NOIRE

Site officiel de l’EP **MATIÈRE NOIRE** de JONAA.

Projet web indépendant de l’application mobile : il ne partage ni code ni dépendances avec elle.

Stack : [Next.js 16](https://nextjs.org) (App Router) · TypeScript · [Tailwind CSS 4](https://tailwindcss.com) · export statique.

## Démarrer

Prérequis : Node.js 20.9 ou plus récent (22 recommandé, voir `.nvmrc`).

```bash
npm install
npm run dev        # serveur de développement → http://localhost:3000
```

## Commandes

| Commande            | Rôle                                                                  |
| ------------------- | --------------------------------------------------------------------- |
| `npm run dev`       | Lance le site en local, avec rechargement automatique                 |
| `npm run lint`      | Vérifie la qualité du code (ESLint)                                   |
| `npm run typecheck` | Vérifie les types TypeScript                                          |
| `npm run build`     | Génère le site statique dans le dossier `out/`                        |
| `npm run preview`   | Sert le dossier `out/` en local pour tester la version finale         |
| `npm run check`     | Lint + types + build : à lancer avant chaque commit                   |

## Site statique

`npm run build` produit des fichiers HTML/CSS/JS dans `out/`. Ce dossier peut être hébergé sur
n’importe quel hébergeur de fichiers statiques (Vercel, Netlify, Cloudflare Pages…), sans serveur
ni base de données.

Conséquence : les fonctionnalités Next.js qui exigent un serveur (Server Actions, cookies,
redirections côté serveur, optimisation d’images à la volée, `cacheComponents`) ne sont pas
utilisées.

## Structure

```
src/
  app/                  # Pages (chaque dossier = une URL)
    layout.tsx          # Gabarit commun : métadonnées, décor, en-tête, pied de page
    page.tsx            # Page d’accueil
    not-found.tsx       # Page 404
    fonts.ts            # Chargement des polices
    globals.css         # Palette, décor cosmique, animations
  components/
    cosmos/             # Décor spatial : ciel, nébuleuses, champ d’étoiles (canvas)
    layout/             # En-tête, pied de page, lien d’accès au contenu
    sections/           # Premier écran et sections de la page
    ui/                 # Éléments réutilisables (boutons)
  config/
    site.ts             # Nom, titre, description, accroche, URL du site
  fonts/                # Fichiers de polices et leurs licences
public/                 # Fichiers servis tels quels (images, icônes)
```

## Identité visuelle

- **Palette** : définie dans `src/app/globals.css` (`void`, `night`, `cosmic`, `star`, `glow`).
- **Polices** : Cormorant Garamond (titres) et Manrope (texte), sous licence SIL Open Font
  License, hébergées dans `src/fonts/` : aucun appel à Google Fonts.
- **Décor** : ciel et nébuleuses en CSS, étoiles dessinées dans un `<canvas>`
  (`src/components/cosmos/Starfield.tsx`). Moins d’étoiles sur petit écran, animation suspendue
  quand l’onglet est masqué, image fixe si « réduire les animations » est activé.

## Contenus officiels

- **Pochette** : le fichier officiel MATIÈRE NOIRE (avec la mention Parental Advisory) sera placé
  dans `public/images/`. Il est utilisé tel quel : aucune retouche, aucun élément ajouté.
- **Aucune donnée inventée** : titres, liens de streaming, clips et réseaux sociaux ne sont
  affichés qu’une fois fournis et vérifiés. Les données de démonstration sont explicitement
  signalées comme telles.
- **Aucune statistique fictive** : un clic vers une plateforme n’est jamais présenté comme une
  écoute.
