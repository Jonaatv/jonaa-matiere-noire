"""
Génère la texture de nébuleuse du fond de l'accueil, inspirée de la pochette.

Bruit fractal (fBm) avec déformation de domaine pour des nuages en volutes,
bande lumineuse diagonale comme sur la pochette, nuages sombres qui la
découpent et fines poussières. Couleurs prises dans la palette de la pochette
uniquement (noirs bleutés, bleu-gris, blanc froid) : aucune couleur ajoutée.

Graine fixe : le résultat est identique à chaque exécution.

Utilisation (Python 3 + numpy + Pillow) :
    python3 scripts/nebuleuse.py
"""

from pathlib import Path

import numpy as np
from PIL import Image

RACINE = Path(__file__).resolve().parent.parent
DESTINATION = RACINE / "public/images/cosmos"
TAILLE = 1800
SORTIES = {1800: 80, 1000: 78}  # largeur → qualité WebP
GRAINE = 20261009

# Dégradé de couleurs relevé sur la pochette (du vide au cœur lumineux).
PALETTE = [
    (0.00, (2, 3, 6)),
    (0.18, (5, 7, 12)),
    (0.34, (13, 17, 23)),
    (0.50, (20, 27, 35)),
    (0.66, (42, 52, 66)),
    (0.80, (60, 69, 81)),
    (0.92, (96, 108, 126)),
    (1.00, (150, 162, 180)),
]


def bruit(rng: np.random.Generator, taille: int, cellules: int) -> np.ndarray:
    """Bruit de valeur lissé : grille aléatoire agrandie en bicubique."""
    grille = rng.random((cellules + 1, cellules + 1)).astype(np.float32)
    image = Image.fromarray(grille, mode="F").resize((taille, taille), Image.Resampling.BICUBIC)
    return np.asarray(image)


def fbm(rng: np.random.Generator, taille: int, base: int, octaves: int, persistance=0.55) -> np.ndarray:
    total = np.zeros((taille, taille), np.float32)
    amplitude, somme = 1.0, 0.0
    for i in range(octaves):
        total += amplitude * bruit(rng, taille, base * 2**i)
        somme += amplitude
        amplitude *= persistance
    return total / somme


def echantillonner(champ: np.ndarray, x: np.ndarray, y: np.ndarray) -> np.ndarray:
    """Lecture bilinéaire de `champ` aux coordonnées (x, y) en pixels."""
    n = champ.shape[0]
    x = np.clip(x, 0, n - 1.001)
    y = np.clip(y, 0, n - 1.001)
    x0, y0 = x.astype(np.int32), y.astype(np.int32)
    fx, fy = x - x0, y - y0
    haut = champ[y0, x0] * (1 - fx) + champ[y0, x0 + 1] * fx
    bas = champ[y0 + 1, x0] * (1 - fx) + champ[y0 + 1, x0 + 1] * fx
    return haut * (1 - fy) + bas * fy


def lisser(v: np.ndarray, a: float, b: float) -> np.ndarray:
    t = np.clip((v - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def main() -> None:
    rng = np.random.default_rng(GRAINE)
    n = TAILLE
    yy, xx = np.mgrid[0:n, 0:n].astype(np.float32)
    u, v = xx / n - 0.5, yy / n - 0.5

    # Déformation de domaine : volutes de nuages.
    wx = fbm(rng, n, 3, 5) - 0.5
    wy = fbm(rng, n, 3, 5) - 0.5
    nuages = fbm(rng, n, 4, 7)
    nuages = echantillonner(nuages, xx + wx * n * 0.12, yy + wy * n * 0.12)

    # Filaments : bruit « en crêtes » (1 - |2b - 1|), étiré par la même déformation.
    cretes = 1 - np.abs(2 * fbm(rng, n, 8, 6, 0.6) - 1)
    cretes = echantillonner(cretes, xx + wy * n * 0.08, yy - wx * n * 0.08) ** 3

    # Détail fin à petite échelle (grain des nuages).
    detail = fbm(rng, n, 48, 4, 0.6)

    # Bande diagonale (haut gauche → bas droite), largeur modulée par le bruit.
    angle = np.deg2rad(28)
    le_long = u * np.cos(angle) + v * np.sin(angle)
    travers = -u * np.sin(angle) + v * np.cos(angle)
    travers = travers + (fbm(rng, n, 3, 4) - 0.5) * 0.16
    bande = np.exp(-(travers / 0.2) ** 2) * np.exp(-(le_long / 0.7) ** 2)
    coeur = np.exp(-(travers / 0.075) ** 2 - (le_long / 0.3) ** 2)

    # Nuages sombres qui découpent la bande (comme sur la pochette), sans la couper en morceaux.
    sombres = fbm(rng, n, 6, 6)
    sombres = echantillonner(sombres, xx - wy * n * 0.1, yy + wx * n * 0.1)
    voile = 1 - 0.6 * lisser(sombres, 0.5, 0.68)

    matiere = 0.45 * lisser(nuages, 0.3, 0.8) + 0.4 * cretes + 0.15 * detail
    energie = matiere * (0.06 + 0.94 * bande) * voile
    energie = energie + 0.9 * coeur * (0.4 + 0.6 * matiere) * voile
    energie = energie + 0.08 * lisser(fbm(rng, n, 2, 4), 0.3, 0.8)

    # Compression douce : pas d'aplat saturé, le cœur reste lumineux mais maîtrisé.
    densite = 1 - np.exp(-1.6 * energie)

    # Poussières : grains fins et nets, plus nombreux dans la bande.
    grains = rng.random((n, n)).astype(np.float32)
    seuil = 0.9975 - 0.006 * bande
    poussiere = (grains > seuil) * rng.uniform(0.25, 0.75, (n, n)).astype(np.float32)
    densite = np.clip(densite + poussiere * (0.3 + 0.7 * bande), 0, 1)

    # Vignettage : bords plus sombres, le regard va vers la perspective centrale.
    distance = np.sqrt(u**2 + v**2)
    densite *= 1 - 0.5 * lisser(distance, 0.3, 0.75)

    positions = np.array([p for p, _ in PALETTE], np.float32)
    couleurs = np.array([c for _, c in PALETTE], np.float32)
    rgb = np.stack([np.interp(densite, positions, couleurs[:, k]) for k in range(3)], axis=-1)
    image = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8), mode="RGB")

    DESTINATION.mkdir(parents=True, exist_ok=True)
    for largeur, qualite in SORTIES.items():
        copie = image if largeur == n else image.resize((largeur, largeur), Image.Resampling.LANCZOS)
        sortie = DESTINATION / f"nebuleuse-{largeur}.webp"
        copie.save(sortie, "WEBP", quality=qualite, method=6)
        print(f"{sortie.relative_to(RACINE)} : {largeur}×{largeur}, {sortie.stat().st_size // 1024} Ko")


if __name__ == "__main__":
    main()
