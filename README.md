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
    layout.tsx          # Gabarit commun : métadonnées, en-tête, pied de page
    page.tsx            # Page d’accueil
    not-found.tsx       # Page 404
    globals.css         # Palette de couleurs et styles de base
  components/
    layout/             # En-tête, pied de page, lien d’accès au contenu
  config/
    site.ts             # Nom, titre, description, URL du site
public/                 # Fichiers servis tels quels (images, icônes)
```

## Contenus officiels

- **Pochette** : le fichier officiel MATIÈRE NOIRE (avec la mention Parental Advisory) sera placé
  dans `public/images/`. Il est utilisé tel quel : aucune retouche, aucun élément ajouté.
- **Aucune donnée inventée** : titres, liens de streaming, clips et réseaux sociaux ne sont
  affichés qu’une fois fournis et vérifiés. Les données de démonstration sont explicitement
  signalées comme telles.
- **Aucune statistique fictive** : un clic vers une plateforme n’est jamais présenté comme une
  écoute.

## Outil de design : 21st MCP (facultatif)

Le fichier `.mcp.json` déclare le serveur [21st MCP](https://21st.dev/mcp) (catalogue de
composants d’interface), ajouté avec la commande officielle
`npx @21st-dev/cli@latest init --client claude --write`. `.claude/settings.json` l’approuve
pour ce projet.

- **Clé API** : à créer sur https://21st.dev/mcp, puis à fournir **uniquement** via la variable
  d’environnement `API_KEY_21ST` (paramètres de l’environnement, jamais dans le code). Le fichier
  `.mcp.json` ne contient que la référence `${API_KEY_21ST}`.
- **Réseau** : l’environnement doit autoriser le domaine `21st.dev`.
- Vérification : `claude mcp get 21st`.
- Le site n’en dépend pas : il se compile et fonctionne sans ce serveur.
