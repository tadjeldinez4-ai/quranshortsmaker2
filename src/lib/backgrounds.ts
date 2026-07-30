export interface Background {
  id: string;
  label: string;
  // gradient | video | image
  kind: "gradient" | "video" | "image";
  value: string; // CSS gradient string OR video URL OR image URL
  poster?: string;
  credit?: string;
}

// Curated free backgrounds. Gradients are guaranteed; videos are CDN-hosted free clips.
export const BACKGROUNDS: Background[] = [
  {
    id: "night-mosque",
    label: "ليل ومسجد",
    kind: "gradient",
    value:
      "radial-gradient(ellipse at 50% 100%, oklch(0.32 0.06 250) 0%, oklch(0.14 0.04 270) 55%, oklch(0.06 0.02 280) 100%)",
  },
  {
    id: "emerald-night",
    label: "زمردي",
    kind: "gradient",
    value:
      "linear-gradient(160deg, oklch(0.18 0.05 160) 0%, oklch(0.10 0.04 180) 60%, oklch(0.06 0.02 200) 100%)",
  },
  {
    id: "golden-dusk",
    label: "غسق ذهبي",
    kind: "gradient",
    value:
      "linear-gradient(180deg, oklch(0.22 0.05 60) 0%, oklch(0.30 0.10 50) 40%, oklch(0.14 0.05 30) 100%)",
  },
  {
    id: "deep-sea",
    label: "أعماق البحر",
    kind: "gradient",
    value:
      "linear-gradient(180deg, oklch(0.22 0.08 230) 0%, oklch(0.12 0.05 240) 60%, oklch(0.05 0.02 250) 100%)",
  },
  {
    id: "starfield",
    label: "سماء النجوم",
    kind: "gradient",
    value: "radial-gradient(circle at 30% 20%, oklch(0.30 0.05 280), oklch(0.05 0.02 270) 70%)",
  },
  {
    id: "rose-dawn",
    label: "فجر وردي",
    kind: "gradient",
    value:
      "linear-gradient(180deg, oklch(0.25 0.08 20) 0%, oklch(0.18 0.06 15) 50%, oklch(0.08 0.03 10) 100%)",
  },
  // Free CDN clips (Pixabay/Pexels) — may take a moment to load.
  {
    id: "ocean",
    label: "محيط",
    kind: "video",
    value: "https://cdn.pixabay.com/video/2020/03/24/34228-400530631_large.mp4",
  },
  {
    id: "rain",
    label: "مطر",
    kind: "video",
    value: "https://cdn.pixabay.com/video/2022/12/11/142000-779989856_large.mp4",
  },
  {
    id: "clouds",
    label: "غيوم",
    kind: "video",
    value: "https://cdn.pixabay.com/video/2020/07/30/45960-446824930_large.mp4",
  },
];
