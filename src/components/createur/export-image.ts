/**
 * Export d'une création du Cosmic Creator en PNG, entièrement dans le
 * navigateur : rien n'est envoyé nulle part (le partage passe par la feuille
 * de partage du système, choisie par le visiteur).
 *
 * L'image est redessinée par le moteur à sa taille finale (même scène, mêmes
 * réglages que l'aperçu), puis la signature est ajoutée et le fichier proposé
 * au téléchargement. Le canvas temporaire et l'adresse du fichier sont libérés
 * juste après.
 */

import type { PortalController } from "@/components/portail/portal-engine";

/** Signature discrète, en bas de chaque image. */
export const SIGNATURE = "JONAA — MATIÈRE NOIRE";

/**
 * Taille de la signature, proportionnelle à l'image (même règle que l'aperçu) :
 * environ 28 px sur une story, 34 px sur un fond de téléphone, 32 px sur un fond d'ordinateur.
 */
export const signatureSize = (width: number, height: number) => Math.min(width * 0.026, height * 0.022);

/** Laisse le navigateur afficher « Préparation… » avant le calcul de l'image. */
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));

/** Police du texte courant du site (police chargée par next/font), sinon une police système. */
function siteFont(): string {
  return getComputedStyle(document.body).fontFamily || "system-ui, sans-serif";
}

/**
 * Signature centrée en bas de l'image, sur une seule ligne, lettres espacées
 * (dessinées une à une : l'espacement des lettres n'est pas pris en charge
 * par tous les navigateurs dans un canvas).
 */
async function drawSignature(context: CanvasRenderingContext2D, width: number, height: number) {
  const size = Math.round(signatureSize(width, height));
  const font = `400 ${size}px ${siteFont()}`;
  try {
    await document.fonts.load(font, SIGNATURE);
  } catch {
    // Police indisponible : la police de secours suffit.
  }
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.globalAlpha = 1;
  context.globalCompositeOperation = "source-over";
  context.font = font;
  context.fillStyle = "rgba(245, 245, 247, 0.55)";
  context.textBaseline = "alphabetic";

  const spacing = size * 0.35;
  const letters = [...SIGNATURE];
  const widths = letters.map((letter) => context.measureText(letter).width);
  const total = widths.reduce((sum, value) => sum + value, 0) + spacing * (letters.length - 1);
  let x = (width - total) / 2;
  const y = height * 0.96 - size * 0.25;
  letters.forEach((letter, index) => {
    context.fillText(letter, x, y);
    x += widths[index] + spacing;
  });
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Image PNG non générée"))), "image/png");
  });
}

/** Propose le fichier au téléchargement, puis libère son adresse temporaire. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Laisse au navigateur le temps de lancer le téléchargement.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Crée l'image finale (PNG) de la scène actuelle, avec la signature. */
export async function renderCreation(
  controller: PortalController,
  width: number,
  height: number,
): Promise<Blob> {
  await nextFrame();
  const canvas = document.createElement("canvas");
  try {
    controller.snapshot(canvas, width, { pixelHeight: height, background: true });
    const context = canvas.getContext("2d");
    if (!context || canvas.width !== width || canvas.height !== height) {
      throw new Error("Canvas indisponible");
    }
    await drawSignature(context, width, height);
    return await toBlob(canvas);
  } finally {
    // Libère tout de suite la mémoire de l'image (importante sur téléphone).
    canvas.width = 0;
    canvas.height = 0;
  }
}

/** Crée l'image et lance son téléchargement. */
export async function exportCreation(
  controller: PortalController,
  width: number,
  height: number,
  filename: string,
): Promise<void> {
  const blob = await renderCreation(controller, width, height);
  downloadBlob(blob, filename);
}

/** Titre proposé à l'application qui reçoit le partage. */
export const SHARE_TITLE = SIGNATURE;

/**
 * Le navigateur sait-il partager un fichier image avec la feuille de partage
 * du système ? (Vérifié avec un petit fichier PNG d'essai, sans rien partager.)
 */
export function canShareImages(): boolean {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") return false;
  if (typeof navigator.canShare !== "function" || typeof File !== "function") return false;
  try {
    return navigator.canShare({ files: [new File([""], "essai.png", { type: "image/png" })] });
  } catch {
    return false;
  }
}

export type ShareResult = "shared" | "cancelled" | "needs-new-tap" | "unsupported" | "failed";

/**
 * Ouvre la feuille de partage du système avec le fichier PNG (et non un lien).
 * À appeler directement depuis l'appui du visiteur : les navigateurs refusent
 * un partage qui n'en vient pas (« needs-new-tap » : il suffit d'appuyer à nouveau).
 */
export async function shareImage(file: File): Promise<ShareResult> {
  if (typeof navigator.share !== "function" || !navigator.canShare?.({ files: [file] })) return "unsupported";
  try {
    await navigator.share({ files: [file], title: SHARE_TITLE });
    return "shared";
  } catch (error) {
    const name = error instanceof Error || error instanceof DOMException ? error.name : "";
    // Feuille de partage fermée par le visiteur : ce n'est pas une erreur.
    if (name === "AbortError") return "cancelled";
    // Appui trop ancien (préparation de l'image trop longue) : le fichier est prêt, un nouvel appui suffit.
    if (name === "NotAllowedError") return "needs-new-tap";
    return "failed";
  }
}
