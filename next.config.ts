import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Site 100 % statique : `npm run build` génère le dossier `out/`,
  // hébergeable sur n'importe quel service de fichiers statiques.
  output: "export",
  images: {
    // L'optimisation d'images par défaut nécessite un serveur,
    // indisponible en export statique.
    unoptimized: true,
  },
  // `cacheComponents` / `partialPrefetching` (activés par défaut par create-next-app)
  // sont incompatibles avec l'export statique : « PPR cannot be enabled in export mode ».
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
