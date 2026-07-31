export interface Background {
  id: string;
  label: string;
  // gradient | video | image
  kind: "gradient" | "video" | "image";
  value: string; // CSS gradient string OR video URL OR image URL
  poster?: string;
  credit?: string;
}

export const DEFAULT_BACKGROUND: Background = {
  id: "default-dark",
  label: "Default Dark",
  kind: "gradient",
  value:
    "radial-gradient(ellipse at 50% 100%, oklch(0.32 0.06 250) 0%, oklch(0.14 0.04 270) 55%, oklch(0.06 0.02 280) 100%)",
};
