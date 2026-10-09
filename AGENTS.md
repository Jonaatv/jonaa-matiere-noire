<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Règles du projet MATIÈRE NOIRE

- Le site est un **export statique** (`output: "export"`). N'utiliser aucune fonctionnalité qui
  exige un serveur. `cacheComponents` est volontairement désactivé (incompatible avec l'export).
- **Ne jamais inventer d'informations artistiques** : titres, liens, clips, réseaux, textes.
  Toute donnée provisoire doit être marquée comme démonstration.
- **Pochette officielle** : l'utiliser telle quelle, sans retouche ni élément ajouté (pas de trou
  noir sur la pochette).
- **Pas de statistiques fictives** : distinguer clic sur une plateforme, ouverture d'un lecteur
  intégré et écoute comptabilisée par la plateforme.
- Lecteurs intégrés : uniquement les lecteurs officiels, chargés au clic du visiteur.
- Accessibilité : navigation clavier, contrastes lisibles, respect de `prefers-reduced-motion`.
- Code, commentaires et commits en français. Lancer `npm run check` avant chaque commit.
