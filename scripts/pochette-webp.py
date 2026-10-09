"""
Génère les versions WebP de la pochette officielle pour le site.

Le PNG original reste la référence et n'est jamais modifié : ce script le
lit seulement, puis écrit des copies redimensionnées (jamais agrandies) et
compressées en WebP, sans recadrage ni autre traitement.

Utilisation (Python 3 + Pillow) :
    python3 scripts/pochette-webp.py
"""

from pathlib import Path

from PIL import Image

RACINE = Path(__file__).resolve().parent.parent
ORIGINAL = RACINE / "public/images/matiere-noire-pochette.png"
DESTINATION = RACINE / "public/images/pochette"
LARGEURS = (480, 800, 1254)
QUALITE = 90


def main() -> None:
    DESTINATION.mkdir(parents=True, exist_ok=True)
    with Image.open(ORIGINAL) as image:
        image = image.convert("RGB")
        for largeur in LARGEURS:
            largeur = min(largeur, image.width)  # jamais agrandie
            hauteur = round(image.height * largeur / image.width)
            copie = image if largeur == image.width else image.resize((largeur, hauteur), Image.Resampling.LANCZOS)
            sortie = DESTINATION / f"matiere-noire-{largeur}.webp"
            copie.save(sortie, "WEBP", quality=QUALITE, method=6)
            print(f"{sortie.relative_to(RACINE)} : {largeur}×{hauteur}, {sortie.stat().st_size // 1024} Ko")


if __name__ == "__main__":
    main()
