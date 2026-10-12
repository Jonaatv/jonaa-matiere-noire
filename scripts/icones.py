"""
Génère le favicon (.ico) et l'icône Apple du site à partir de la même
étoile que `src/app/icon.svg` : étoile à quatre branches blanc froid,
halo bleu nuit, fond noir. La pochette n'est pas utilisée ni modifiée.

Utilisation (Python 3 + numpy + Pillow) :
    python3 scripts/icones.py
"""

from pathlib import Path

import numpy as np
from PIL import Image

RACINE = Path(__file__).resolve().parent.parent
APP = RACINE / "src/app"

NOIR = np.array([5, 5, 8], np.float32)  # --color-void
BLEU_NUIT = np.array([37, 59, 133], np.float32)  # --color-cosmic
BLANC = np.array([245, 245, 247], np.float32)  # --color-star


def etoile(taille: int, sur_echantillonnage: int = 4) -> Image.Image:
    """Dessine l'icône en haute résolution puis la réduit (bords lissés)."""
    n = taille * sur_echantillonnage
    y, x = (np.mgrid[0:n, 0:n].astype(np.float32) + 0.5) / n * 2 - 1  # de -1 à 1
    ax, ay = np.abs(x), np.abs(y)

    # Étoile à quatre branches : contour en astroïde, |x|^p + |y|^p <= r^p avec p < 1.
    p, r = 0.5, 0.64
    forme = (ax**p + ay**p) <= r**p
    halo = np.clip(1 - np.sqrt(x**2 + y**2) / 0.75, 0, 1) ** 1.6 * 0.85

    couleur = NOIR + (BLEU_NUIT - NOIR) * halo[..., None]
    couleur = np.where(forme[..., None], BLANC, couleur)
    image = Image.fromarray(couleur.astype(np.uint8), "RGB")
    return image.resize((taille, taille), Image.Resampling.LANCZOS)


def main() -> None:
    # Icône Apple : 180 × 180, fond opaque (iOS arrondit lui-même les coins).
    etoile(180).save(APP / "apple-icon.png", optimize=True)
    # Favicon .ico multi-tailles pour les navigateurs et onglets.
    grande = etoile(64).convert("RGBA")  # Next.js exige des images RGBA dans le .ico
    grande.save(APP / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    for fichier in ("apple-icon.png", "favicon.ico"):
        chemin = APP / fichier
        print(f"{chemin.relative_to(RACINE)} : {chemin.stat().st_size} octets")


if __name__ == "__main__":
    main()
