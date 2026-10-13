"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

import {
  getPaused,
  getReducedMotion,
  subscribePaused,
  subscribeReducedMotion,
} from "@/components/cosmos/motion-preference";
import { startPortal, type PortalController } from "@/components/portail/portal-engine";
import {
  SIGNATURE,
  canShareImages,
  downloadBlob,
  exportCreation,
  renderCreation,
  shareImage,
} from "@/components/createur/export-image";
import {
  brightnessRange,
  buildTheme,
  cosmicAmbiances,
  cosmicColors,
  cosmicFormats,
  densityRange,
  type CosmicAmbiance,
} from "@/config/cosmic-ambiances";

/** Même ciel à chaque visite : le tirage des particules part toujours de cette graine. */
const SEED = 20261012;

/** Hauteur maximale de l'aperçu (variable CSS, plus grande sur ordinateur). */
const MAX_PREVIEW_HEIGHT = "var(--hauteur-apercu)";

/** Valeur d'un curseur, lisible : « 100 % ». */
const percent = (value: number) => `${Math.round(value * 100)} %`;

/** État des actions « Télécharger » et « Partager » (un seul message à la fois). */
type ExportState =
  | "idle"
  | "preparing"
  | "done"
  | "error"
  | "sharing"
  | "shared"
  | "share-cancelled"
  | "share-ready"
  | "share-fallback"
  | "share-error";

const STATUS: Record<Exclude<ExportState, "idle">, string> = {
  preparing: "Création de l’image en haute résolution…",
  done: "Image prête : le téléchargement a été lancé.",
  error: "L’image n’a pas pu être créée. Réessayez, ou choisissez un format plus petit.",
  sharing: "Choisissez où partager votre création…",
  shared: "Création partagée.",
  "share-cancelled": "Partage annulé. Votre création reste disponible.",
  "share-ready": "Image prête : appuyez de nouveau sur « Partager ma création » pour l’envoyer.",
  "share-fallback":
    "Le partage direct n’est pas disponible sur ce navigateur : l’image a été téléchargée. Vous pouvez ensuite la partager depuis votre appareil.",
  "share-error":
    "Le partage n’a pas abouti. Téléchargez l’image, puis partagez-la depuis votre appareil.",
};

/** Prise en charge du partage de fichiers : ne change pas pendant la visite. */
const noSubscribe = () => () => {};

const colorOf = (id: string) => cosmicColors.find((item) => item.id === id) ?? cosmicColors[0];

/**
 * Cosmic Creator : aperçu animé du portail dans le cadre du format choisi,
 * choix de l'ambiance, puis personnalisation (couleur dominante, luminosité,
 * densité). Chaque choix règle réellement le moteur, en direct.
 * Choisir une ambiance remet la couleur et les curseurs à ses valeurs.
 *
 * Réduction des animations ou pause du site : l'aperçu devient une image
 * fixe, qui suit toujours les choix d'ambiance et de format.
 *
 * `intro` : titre et présentation de la page, placés au-dessus de l'aperçu sur
 * mobile et dans la colonne des réglages sur ordinateur (l'aperçu reste entier à l'écran).
 */
export function CosmicCreator({ intro }: { intro: ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<PortalController | null>(null);
  const [ambianceId, setAmbianceId] = useState(cosmicAmbiances[0].id);
  const [formatId, setFormatId] = useState(cosmicFormats[1].id);
  const [colorId, setColorId] = useState(cosmicAmbiances[0].colorId);
  const [brightness, setBrightness] = useState(cosmicAmbiances[0].light.brightness);
  const [density, setDensity] = useState(cosmicAmbiances[0].light.density);

  const ambiance = cosmicAmbiances.find((item) => item.id === ambianceId) ?? cosmicAmbiances[0];
  const format = cosmicFormats.find((item) => item.id === formatId) ?? cosmicFormats[1];
  const color = colorOf(colorId);
  const ratio = format.width / format.height;
  const theme = useMemo(
    () => buildTheme(ambiance, color, brightness, density),
    [ambiance, color, brightness, density],
  );

  /** Choisir une ambiance (ou la réinitialiser) : couleur et curseurs reprennent ses valeurs. */
  const applyAmbiance = (item: CosmicAmbiance) => {
    setAmbianceId(item.id);
    setColorId(item.colorId);
    setBrightness(item.light.brightness);
    setDensity(item.light.density);
  };
  const modified =
    colorId !== ambiance.colorId ||
    brightness !== ambiance.light.brightness ||
    density !== ambiance.light.density;

  // Export PNG et partage : une seule action à la fois (boutons désactivés pendant l'action).
  const [exportState, setExportState] = useState<ExportState>("idle");
  const [busyAction, setBusyAction] = useState<"download" | "share" | null>(null);
  const exportingRef = useRef(false);
  const filename = `jonaa-matiere-noire-${ambiance.id}-${format.id}.png`;
  const canShare = useSyncExternalStore(noSubscribe, canShareImages, () => false);

  /**
   * Image préparée pour le partage, gardée tant que les réglages ne changent
   * pas : si le navigateur refuse un partage arrivé trop tard après l'appui,
   * un nouvel appui la partage immédiatement.
   */
  const settingsKey = `${ambiance.id}|${colorId}|${brightness}|${density}|${format.id}`;
  const preparedRef = useRef<{ key: string; file: File } | null>(null);
  useEffect(() => {
    if (preparedRef.current?.key !== settingsKey) preparedRef.current = null;
  }, [settingsKey]);

  const run = async (action: "download" | "share", task: () => Promise<void>) => {
    if (!controllerRef.current || exportingRef.current) return;
    exportingRef.current = true;
    setBusyAction(action);
    try {
      await task();
    } finally {
      exportingRef.current = false;
      setBusyAction(null);
    }
  };

  const download = () =>
    run("download", async () => {
      setExportState("preparing");
      try {
        await exportCreation(controllerRef.current!, format.width, format.height, filename);
        setExportState("done");
      } catch {
        setExportState("error");
      }
    });

  const share = () =>
    run("share", async () => {
      // L'image déjà préparée (mêmes réglages) part tout de suite, encore dans l'appui du visiteur.
      let file = preparedRef.current?.key === settingsKey ? preparedRef.current.file : null;
      const wasReady = file !== null;
      if (!file) {
        setExportState("preparing");
        try {
          const blob = await renderCreation(controllerRef.current!, format.width, format.height);
          file = new File([blob], filename, { type: "image/png" });
        } catch {
          setExportState("error");
          return;
        }
        preparedRef.current = { key: settingsKey, file };
      }

      if (!canShare) {
        // Solution de secours : téléchargement, puis partage depuis l'appareil.
        downloadBlob(file, filename);
        setExportState("share-fallback");
        return;
      }

      setExportState("sharing");
      const result = await shareImage(file);
      if (result === "shared") setExportState("shared");
      else if (result === "cancelled") setExportState("share-cancelled");
      else if (result === "needs-new-tap" && !wasReady) setExportState("share-ready");
      else if (result === "unsupported") {
        downloadBlob(file, filename);
        setExportState("share-fallback");
      } else setExportState("share-error");
    });

  const paused = useSyncExternalStore(subscribePaused, getPaused, () => false);
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);
  const calm = paused || reducedMotion;
  const calmRef = useRef(calm);
  const themeRef = useRef(theme);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const controller = startPortal(canvas, {
      calm: calmRef.current,
      theme: themeRef.current,
      seed: SEED,
    });
    controllerRef.current = controller;

    // Rien n'est dessiné quand l'aperçu n'est pas visible (onglet masqué, page défilée).
    let onScreen = true;
    const updateVisibility = () => controller.setVisible(onScreen && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      updateVisibility();
    });
    observer.observe(canvas);
    document.addEventListener("visibilitychange", updateVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", updateVisibility);
      controller.destroy();
      controllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    calmRef.current = calm;
    controllerRef.current?.setCalm(calm);
  }, [calm]);

  useEffect(() => {
    themeRef.current = theme;
    controllerRef.current?.setTheme(theme);
  }, [theme]);

  return (
    <div className="grid grid-cols-1 items-start gap-10 [--hauteur-apercu:min(44svh,30rem)] lg:grid-cols-12 lg:gap-x-16 lg:gap-y-12 lg:[--hauteur-apercu:min(74svh,48rem)]">
      <div className="lg:col-span-5 lg:col-start-8 lg:row-start-1">{intro}</div>

      {/*
        Aperçu : cadre aux proportions exactes du format, jamais étiré.
        Toujours à l'écran pendant les réglages : collé en haut sur mobile
        (les réglages défilent dessous), à gauche sur ordinateur.
      */}
      <figure className="sticky top-0 z-10 -mx-5 flex flex-col items-center gap-3 bg-void px-5 py-3 sm:-mx-10 sm:px-10 lg:top-6 lg:col-span-7 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:mx-0 lg:gap-4 lg:bg-transparent lg:p-0">
        <div
          role="img"
          aria-label={`Aperçu animé du portail, ambiance ${ambiance.name}, couleur ${color.name.toLowerCase()}, format ${format.name}`}
          className="relative overflow-hidden rounded-sm shadow-[0_40px_120px_rgb(37_59_133/0.25)] ring-1 ring-cosmic/60 [container-type:size]"
          style={{
            aspectRatio: `${format.width} / ${format.height}`,
            width: `min(100%, calc(${MAX_PREVIEW_HEIGHT} * ${ratio}))`,
            // Même fond que l'image exportée : noir profond et halo bleu nuit.
            background: "radial-gradient(circle at 50% 50%, rgb(8 13 36 / 0.9), rgb(8 13 36 / 0) 75%), rgb(5 5 8)",
          }}
        >
          <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 size-full" />
          {/* Signature, à la même taille relative que sur l'image exportée (voir export-image.ts). */}
          <p
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-[4%] text-center text-[min(2.6cqw,2.2cqh)] tracking-[0.35em] whitespace-nowrap text-star/55"
          >
            {SIGNATURE}
          </p>
        </div>
        <figcaption aria-live="polite" className="text-xs tracking-[0.24em] text-star/60 uppercase">
          {format.name} · {format.width} × {format.height}
        </figcaption>
      </figure>

      <div className="flex flex-col gap-10 lg:col-span-5 lg:col-start-8 lg:row-start-2">
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-4 text-xs tracking-[0.36em] text-glow uppercase">Ambiance</legend>
          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {cosmicAmbiances.map((item) => (
              <label
                key={item.id}
                className="flex min-h-16 cursor-pointer items-center gap-4 rounded-sm border border-cosmic/60 bg-night/50 px-4 py-3 transition-colors hover:border-glow/60 has-checked:border-glow has-checked:bg-night/80 has-focus-visible:outline-2 has-focus-visible:outline-offset-3 has-focus-visible:outline-glow"
              >
                <input
                  type="radio"
                  name="ambiance"
                  value={item.id}
                  checked={item.id === ambianceId}
                  onChange={() => applyAmbiance(item)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className="size-9 shrink-0 rounded-full border border-star/15"
                  style={{
                    background: swatch(colorOf(item.colorId)),
                  }}
                />
                <span className="flex flex-col gap-0.5">
                  <span className="font-display text-xl leading-tight">{item.name}</span>
                  <span className="text-xs leading-snug text-star/65">{item.description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-6">
          <legend className="mb-4 text-xs tracking-[0.36em] text-glow uppercase">Personnaliser</legend>

          <div role="radiogroup" aria-labelledby="titre-couleur" className="flex flex-col gap-3">
            <p id="titre-couleur" className="text-[0.9375rem]">
              Couleur dominante <span className="text-star/60">· {color.name}</span>
            </p>
            <div className="flex flex-wrap gap-3">
              {cosmicColors.map((item) => (
                <label
                  key={item.id}
                  title={item.name}
                  className="flex size-12 cursor-pointer items-center justify-center rounded-full border border-cosmic/60 transition-colors hover:border-glow/60 has-checked:border-glow has-focus-visible:outline-2 has-focus-visible:outline-offset-3 has-focus-visible:outline-glow"
                >
                  <input
                    type="radio"
                    name="couleur"
                    value={item.id}
                    checked={item.id === colorId}
                    onChange={() => setColorId(item.id)}
                    className="sr-only"
                  />
                  <span className="sr-only">{item.name}</span>
                  <span aria-hidden="true" className="size-8 rounded-full" style={{ background: swatch(item) }} />
                </label>
              ))}
            </div>
          </div>

          <Slider
            id="luminosite"
            label="Luminosité"
            value={brightness}
            range={brightnessRange}
            onChange={setBrightness}
          />
          <Slider
            id="densite"
            label="Densité des particules"
            value={density}
            range={densityRange}
            onChange={setDensity}
          />

          <button
            type="button"
            onClick={() => applyAmbiance(ambiance)}
            disabled={!modified}
            className="inline-flex min-h-11 items-center self-start rounded-full border border-star/30 px-5 text-xs tracking-[0.18em] uppercase transition-colors hover:border-glow hover:text-glow disabled:cursor-default disabled:border-star/15 disabled:text-star/50 disabled:hover:text-star/50"
          >
            Revenir aux réglages de l’ambiance
          </button>
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-4 text-xs tracking-[0.36em] text-glow uppercase">Format</legend>
          <div className="flex flex-col gap-3">
            {cosmicFormats.map((item) => (
              <label
                key={item.id}
                className="flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-sm border border-cosmic/60 bg-night/50 px-4 py-3 transition-colors hover:border-glow/60 has-checked:border-glow has-checked:bg-night/80 has-focus-visible:outline-2 has-focus-visible:outline-offset-3 has-focus-visible:outline-glow"
              >
                <input
                  type="radio"
                  name="format"
                  value={item.id}
                  checked={item.id === formatId}
                  onChange={() => setFormatId(item.id)}
                  className="sr-only"
                />
                <span className="flex items-center gap-4">
                  {/* Petit gabarit aux proportions du format. */}
                  <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center">
                    <span
                      className="block rounded-[2px] border border-star/50"
                      style={
                        item.width > item.height
                          ? { width: "2rem", aspectRatio: `${item.width} / ${item.height}` }
                          : { height: "2rem", aspectRatio: `${item.width} / ${item.height}` }
                      }
                    />
                  </span>
                  <span className="text-[0.9375rem]">{item.name}</span>
                </span>
                <span className="text-xs text-star/60 tabular-nums">
                  {item.width} × {item.height}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-1">
            <button
              type="button"
              onClick={download}
              disabled={busyAction !== null}
              aria-describedby="etat-export"
              className="inline-flex min-h-14 items-center justify-center rounded-full bg-star px-6 text-[0.8125rem] font-semibold tracking-[0.14em] text-void uppercase transition-colors hover:bg-glow disabled:cursor-progress disabled:bg-star/60"
            >
              {busyAction === "download" ? "Préparation…" : "Télécharger ma création"}
            </button>
            <button
              type="button"
              onClick={share}
              disabled={busyAction !== null}
              aria-describedby="etat-export"
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full border border-star/40 px-6 text-[0.8125rem] font-medium tracking-[0.14em] uppercase transition-colors hover:border-glow hover:text-glow disabled:cursor-progress disabled:border-star/20 disabled:text-star/60"
            >
              <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" className="size-4 shrink-0" fill="none">
                <path
                  d="M8 10V2.5M5 5.5l3-3 3 3M3.5 8.5v4.5h9V8.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {busyAction === "share" && exportState === "preparing" ? "Préparation…" : "Partager ma création"}
            </button>
          </div>
          <p id="etat-export" aria-live="polite" className="min-h-10 text-sm leading-relaxed text-star/70">
            {exportState === "idle"
              ? `Image PNG · ${format.width} × ${format.height} px${
                  canShare ? "" : " · Sur ce navigateur, le partage passe par le téléchargement."
                }`
              : STATUS[exportState]}
          </p>
        </div>
      </div>
    </div>
  );
}

/** Pastille d'une couleur : cœur glacé, lumière électrique, halo, noir. */
function swatch(color: { electric: string; ice: string; night: string }) {
  return `radial-gradient(circle, rgb(${color.ice}) 0 12%, rgb(${color.electric}) 30%, rgb(${color.night}) 62%, rgb(5 5 8) 100%)`;
}

/** Curseur accessible : libellé, valeur lisible (affichée et annoncée), flèches du clavier. */
function Slider({
  id,
  label,
  value,
  range,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  range: { min: number; max: number; step: number };
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-[0.9375rem]">
          {label}
        </label>
        <output htmlFor={id} className="text-sm text-star/70 tabular-nums">
          {percent(value)}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={range.min}
        max={range.max}
        step={range.step}
        value={value}
        aria-valuetext={percent(value)}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-11 w-full cursor-pointer accent-glow"
      />
    </div>
  );
}
