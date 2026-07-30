import type { VerseWithAudio } from "./quran-api";
import { stripArabicDiacritics } from "./arabic";

export interface ExportStyle {
  fontSize: number;
  lineHeight: number;
  textY: number; // percent
  textColor: string;
  highlightColor: string;
  shadow: number;
  stroke: number;
  overlayOpacity: number;
  blur: number;
  brightness: number;
  wordsPerChunk: number;
  showTranslation: boolean;
  translationSize: number;
  translationColor: string;
  showArabic: boolean;
  translationAsMain: boolean;
  wordSyncEnabled: boolean;
  arabicFontFamily?: string;
  showSurahName: boolean;
  surahNameSize: number;
  surahName?: string;
  startOffsetSec?: number;
}

export interface ExportInputs {
  clips: VerseWithAudio[];
  style: ExportStyle;
  backgroundKind: "gradient" | "video" | "image";
  backgroundValue: string; // CSS gradient | video URL | image URL
  startOffsetSec?: number;
  onProgress: (p: number) => void; // 0..1
  signal?: AbortSignal;
}

const W = 1080;
const H = 1920;
const FPS = 30;

function pickMime(): { mime: string; ext: string } {
  const candidates = [
    { mime: "video/mp4;codecs=avc1.42E01F,mp4a.40.2", ext: "mp4" },
    { mime: "video/mp4", ext: "mp4" },
    { mime: "video/webm;codecs=vp9,opus", ext: "webm" },
    { mime: "video/webm;codecs=vp8,opus", ext: "webm" },
    { mime: "video/webm", ext: "webm" },
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c.mime)) return c;
  }
  return { mime: "", ext: "webm" };
}

function parseLinearGradient(css: string): { stops: { color: string; pos: number }[] } | null {
  // Very small parser for "linear-gradient(angle, c1 p%, c2 p%, ...)"
  const m = css.match(/linear-gradient\(([^)]+)\)/i);
  if (!m) return null;
  const parts = m[1].split(",").map((s) => s.trim());
  // first part may be angle; skip if it ends with 'deg' or contains 'to '
  let i = 0;
  if (/deg$/.test(parts[0]) || /^to /.test(parts[0])) i = 1;
  const stops = parts.slice(i).map((p, idx, arr) => {
    const sm = p.match(/^(.+?)\s+(\d+(?:\.\d+)?)%$/);
    if (sm) return { color: sm[1], pos: parseFloat(sm[2]) / 100 };
    return { color: p, pos: idx / Math.max(1, arr.length - 1) };
  });
  return { stops };
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  src: CanvasImageSource,
  sw0: number,
  sh0: number,
) {
  const vr = sw0 / sh0;
  const cr = W / H;
  let sx = 0,
    sy = 0,
    sw = sw0,
    sh = sh0;
  if (vr > cr) {
    sw = sh0 * cr;
    sx = (sw0 - sw) / 2;
  } else {
    sh = sw0 / cr;
    sy = (sh0 - sh) / 2;
  }
  ctx.drawImage(src, sx, sy, sw, sh, 0, 0, W, H);
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  kind: "gradient" | "video" | "image",
  value: string,
  video: HTMLVideoElement | null,
  image: HTMLImageElement | null,
) {
  if (kind === "video" && video && video.readyState >= 2) {
    drawCover(ctx, video, video.videoWidth, video.videoHeight);
    return;
  }
  if (kind === "image" && image && image.complete && image.naturalWidth) {
    drawCover(ctx, image, image.naturalWidth, image.naturalHeight);
    return;
  }
  const g = parseLinearGradient(value);
  if (g) {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    g.stops.forEach((s) => grad.addColorStop(Math.max(0, Math.min(1, s.pos)), s.color));
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = value || "#000";
  }
  ctx.fillRect(0, 0, W, H);
}

export async function exportVideo(input: ExportInputs): Promise<Blob> {
  const { clips, style, backgroundKind, backgroundValue, onProgress, signal } = input;
  if (!clips.length) throw new Error("No clips to export");

  // ─── Setup canvas ───
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { alpha: false })!;

  // ─── Setup optional bg video ───
  let bgVideo: HTMLVideoElement | null = null;
  if (backgroundKind === "video") {
    bgVideo = document.createElement("video");
    bgVideo.src = backgroundValue;
    bgVideo.crossOrigin = "anonymous";
    bgVideo.muted = true;
    bgVideo.loop = true;
    bgVideo.playsInline = true;
    try {
      await new Promise<void>((res, rej) => {
        bgVideo!.onloadeddata = () => res();
        bgVideo!.onerror = () => rej(new Error("Background video failed to load"));
      });
      await bgVideo.play().catch(() => {});
    } catch {
      bgVideo = null;
    }
  }

  // ─── Setup optional bg image ───
  let bgImage: HTMLImageElement | null = null;
  if (backgroundKind === "image") {
    bgImage = new Image();
    bgImage.crossOrigin = "anonymous";
    bgImage.src = backgroundValue;
    try {
      await new Promise<void>((res, rej) => {
        bgImage!.onload = () => res();
        bgImage!.onerror = () => rej(new Error("Background image failed to load"));
      });
    } catch {
      bgImage = null;
    }
  }

  // Ensure the uploaded Surah-name font is ready for canvas drawing.
  try {
    await document.fonts.load('12px "Surah Name"');
  } catch {
    // ignore
  }

  // ─── Audio mixing ───
  const AudioCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioCtor();
  const dest = audioCtx.createMediaStreamDestination();

  // Pre-decode audio buffers for gapless playback
  onProgress(0);
  const buffers: AudioBuffer[] = [];
  for (let i = 0; i < clips.length; i++) {
    const r = await fetch(clips[i].audio.url);
    const ab = await r.arrayBuffer();
    const buf = await audioCtx.decodeAudioData(ab);
    buffers.push(buf);
    if (signal?.aborted) throw new Error("aborted");
  }

  // ─── Video stream ───
  // Use captureStream(0) so frames are only emitted when we call requestFrame().
  // This avoids browser-throttled rAF (background tabs, vsync mismatch) causing
  // dropped/duplicated frames in the recorded MP4.
  const videoStream = canvas.captureStream(0);
  const videoTrack = videoStream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack & {
    requestFrame?: () => void;
  };
  const combined = new MediaStream([
    ...videoStream.getVideoTracks(),
    ...dest.stream.getAudioTracks(),
  ]);

  const { mime, ext } = pickMime();
  const recorder = new MediaRecorder(
    combined,
    mime ? { mimeType: mime, videoBitsPerSecond: 8_000_000 } : undefined,
  );
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const totalDurationMs = buffers.reduce((s, b) => s + b.duration * 1000, 0);
  const startTimes: number[] = [];
  {
    let acc = 0;
    for (const b of buffers) {
      startTimes.push(acc);
      acc += b.duration * 1000;
    }
  }

  const startOffsetSec = input.startOffsetSec ?? input.style.startOffsetSec ?? 0;
  const trimStartMs = Math.max(0, startOffsetSec * 1000);
  const trimmedTotalMs = Math.max(100, totalDurationMs - trimStartMs);

  // ─── Schedule audio playback into destination ───
  const t0 = audioCtx.currentTime + 0.15;
  buffers.forEach((buf, i) => {
    const bufStartMs = startTimes[i];
    const bufEndMs = bufStartMs + buf.duration * 1000;

    if (bufEndMs > trimStartMs) {
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      src.connect(dest);

      if (bufStartMs >= trimStartMs) {
        const delaySec = (bufStartMs - trimStartMs) / 1000;
        src.start(t0 + delaySec);
      } else {
        const offsetSec = (trimStartMs - bufStartMs) / 1000;
        const durationSec = buf.duration - offsetSec;
        src.start(t0, offsetSec, offsetSec < buf.duration ? durationSec : 0);
      }
    }
  });

  // Prime the canvas so the very first captured frame isn't blank.
  const frameDurMs = 1000 / FPS;
  drawFrame(trimStartMs);
  videoTrack.requestFrame?.();

  // ─── Render loop: recorder starts exactly when audio starts, ends when
  // trimmed audio ends.
  await new Promise<void>((resolve, reject) => {
    let stopped = false;
    let started = false;
    recorder.onstop = () => {
      onProgress(1);
      resolve();
    };

    const emit = () => {
      if (stopped) return;
      if (signal?.aborted) {
        stopped = true;
        if (started) recorder.stop();
        reject(new Error("aborted"));
        return;
      }
      const elapsedMs = Math.max(0, (audioCtx.currentTime - t0) * 1000);
      const t = Math.min(elapsedMs, trimmedTotalMs);
      const globalMs = t + trimStartMs;
      drawFrame(globalMs);
      videoTrack.requestFrame?.();
      onProgress(Math.min(0.99, t / trimmedTotalMs));
      if (elapsedMs >= trimmedTotalMs) {
        stopped = true;
        // Stop immediately — no tail — so exported duration matches audio.
        recorder.stop();
        return;
      }
      setTimeout(emit, frameDurMs);
    };

    // Start the recorder exactly when audio playback begins.
    const waitForStart = () => {
      if (audioCtx.currentTime >= t0) {
        started = true;
        recorder.start();
        emit();
      } else {
        setTimeout(waitForStart, 2);
      }
    };
    waitForStart();
  });

  // Build blob
  const blob = new Blob(chunks, { type: mime || "video/webm" });
  (blob as Blob & { _ext?: string })._ext = ext;
  return blob;

  function drawFrame(globalMs: number) {
    // determine current clip
    let idx = 0;
    for (let i = 0; i < startTimes.length; i++) {
      if (globalMs >= startTimes[i]) idx = i;
    }
    const clip = clips[idx];
    const localMs = globalMs - startTimes[idx];

    drawBackground(ctx, backgroundKind, backgroundValue, bgVideo, bgImage);

    // FX: brightness via overlay; (blur on canvas is expensive — apply softly via filter on draws of video only)
    if (style.brightness !== 1) {
      ctx.fillStyle = `rgba(0,0,0,${1 - style.brightness < 0 ? 0 : 1 - style.brightness})`;
      if (style.brightness < 1) ctx.fillRect(0, 0, W, H);
    }

    // overlay gradient
    const og = ctx.createLinearGradient(0, 0, 0, H);
    og.addColorStop(0, `rgba(0,0,0,${style.overlayOpacity * 0.6})`);
    og.addColorStop(1, `rgba(0,0,0,${style.overlayOpacity})`);
    ctx.fillStyle = og;
    ctx.fillRect(0, 0, W, H);

    // Active word
    const segs = clip.audio.segments;
    let activeWordPos = 0;
    if (style.wordSyncEnabled) {
      for (const s of segs) {
        if (localMs >= s.startMs && localMs <= s.endMs) {
          activeWordPos = s.wordPosition;
          break;
        }
      }
      if (!activeWordPos) {
        for (const s of segs) if (localMs > s.endMs) activeWordPos = s.wordPosition;
      }
    }

    const words = clip.words.filter((w) => w.char_type_name === "word");
    const chunkSize = Math.max(1, style.wordsPerChunk);
    const activeIdx = style.wordSyncEnabled
      ? Math.max(
          0,
          words.findIndex((w) => w.position === activeWordPos),
        )
      : Math.min(
          Math.max(0, words.length - 1),
          Math.max(0, Math.floor((localMs / Math.max(1, clip.audio.durationMs)) * words.length)),
        );
    const chunkIdx = Math.floor(activeIdx / chunkSize);
    const chunk = words.slice(chunkIdx * chunkSize, (chunkIdx + 1) * chunkSize);

    // Compute effective sizes based on translationAsMain
    const scale = W / 1080;
    const mainPx = style.fontSize * 3 * scale;
    const secPx = style.translationSize * 3 * scale;
    const arabicPx = style.translationAsMain ? secPx : mainPx;
    const transPx = style.translationAsMain ? mainPx : secPx;
    const arabicFF = style.arabicFontFamily || '"Amiri Quran", "Amiri", serif';
    const isZain = /zain/i.test(arabicFF);
    const displayText = (w: { text_uthmani: string }) =>
      isZain ? stripArabicDiacritics(w.text_uthmani) : w.text_uthmani;
    const cy = (style.textY / 100) * H;

    const chunkTranslation = chunk
      .map((w) => (w as { translation?: string }).translation)
      .filter(Boolean)
      .join(" ")
      .trim();
    const hasArabic = style.showArabic;
    const hasTrans = style.showTranslation && !!chunkTranslation;

    // Measure arabic layout
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.font = `${arabicPx}px ${arabicFF}`;
    const gap = arabicPx * 0.18;
    const widths = chunk.map((w) => ctx.measureText(displayText(w)).width);
    const totalW = widths.reduce((s, w) => s + w, 0) + gap * Math.max(0, chunk.length - 1);
    const maxW = W - 120;
    const fit = Math.min(1, maxW / Math.max(1, totalW));
    const eff = (n: number) => n * fit;
    const effArabic = arabicPx * fit;

    // Measure translation layout
    ctx.font = `italic ${transPx}px "Inter", system-ui, sans-serif`;
    const maxTrW = W - 140;
    const trLines = hasTrans ? wrapText(ctx, chunkTranslation, maxTrW) : [];
    const trLineH = transPx * 1.35;
    const trHeight = trLines.length * trLineH;

    // Compute vertical layout centered around cy
    const spacing = 24;
    const arabicH = hasArabic ? effArabic : 0;
    const arabicFirst = !style.translationAsMain;
    let arabicCy = cy;
    let transTop = cy;
    if (hasArabic && hasTrans) {
      const totalH = arabicH + spacing + trHeight;
      const top = cy - totalH / 2;
      if (arabicFirst) {
        arabicCy = top + arabicH / 2;
        transTop = top + arabicH + spacing;
      } else {
        transTop = top;
        arabicCy = top + trHeight + spacing + arabicH / 2;
      }
    } else if (hasTrans) {
      transTop = cy - trHeight / 2;
    }

    // Draw Arabic
    if (hasArabic) {
      ctx.font = `${effArabic}px ${arabicFF}`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      let cursor = (W + eff(totalW)) / 2;
      chunk.forEach((w, i) => {
        const wW = eff(widths[i]);
        const x = cursor - wW / 2;
        cursor -= wW + eff(gap);
        const isActive = w.position === activeWordPos;
        const isPast = activeWordPos > 0 && w.position < activeWordPos;
        const color = isActive ? style.highlightColor : style.textColor;
        const opacity = isActive ? 1 : isPast ? 0.95 : 0.55;
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.shadowColor = "rgba(0,0,0,0.85)";
        ctx.shadowBlur = (style.shadow + (isActive ? 8 : 0)) * 2;
        ctx.shadowOffsetY = 4;
        if (style.stroke > 0) {
          ctx.lineWidth = style.stroke * 3;
          ctx.strokeStyle = "rgba(0,0,0,0.6)";
          ctx.strokeText(displayText(w), x, arabicCy);
        }
        ctx.fillStyle = color;
        ctx.fillText(displayText(w), x, arabicCy);
        ctx.restore();
      });
    }

    // Draw Translation
    if (hasTrans) {
      ctx.font = `italic ${transPx}px "Inter", system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.save();
      ctx.globalAlpha = 0.95;
      ctx.shadowColor = "rgba(0,0,0,0.9)";
      ctx.shadowBlur = Math.max(12, style.shadow * 2);
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = style.translationAsMain ? style.textColor : style.translationColor;
      trLines.forEach((ln, i) => {
        ctx.fillText(ln, W / 2, transTop + i * trLineH);
      });
      ctx.restore();
    }

    // Draw Surah name at the bottom
    if (style.showSurahName && style.surahName) {
      const surahPx = style.surahNameSize * 3 * scale;
      ctx.save();
      ctx.font = `${surahPx}px "Surah Name", "Amiri Quran", serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.globalAlpha = 0.95;
      ctx.shadowColor = "rgba(0,0,0,0.9)";
      ctx.shadowBlur = Math.max(12, style.shadow * 2);
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = style.textColor;
      ctx.fillText(style.surahName, W / 2, H - 80);
      ctx.restore();
    }
  }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
