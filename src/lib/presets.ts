export interface Preset {
  id: string;
  label: string;
  textColor: string;
  highlightColor: string;
  fontSize: number;
  strokeWidth: number;
  shadow: number;
  overlayOpacity: number;
  blur: number;
}

export const PRESETS: Preset[] = [
  {
    id: "golden-emerald",
    label: "Golden Emerald",
    textColor: "#eac65f",
    highlightColor: "#10b981",
    fontSize: 58,
    strokeWidth: 0,
    shadow: 20,
    overlayOpacity: 0.45,
    blur: 0,
  },
  {
    id: "minimal",
    label: "Minimal",
    textColor: "#ffffff",
    highlightColor: "#ffe9a8",
    fontSize: 56,
    strokeWidth: 0,
    shadow: 18,
    overlayOpacity: 0.35,
    blur: 0,
  },
  {
    id: "gold",
    label: "Gold",
    textColor: "#f5e6c5",
    highlightColor: "#f3c361",
    fontSize: 60,
    strokeWidth: 0,
    shadow: 22,
    overlayOpacity: 0.45,
    blur: 2,
  },
  {
    id: "emerald",
    label: "Emerald",
    textColor: "#e8fff3",
    highlightColor: "#5ee9a0",
    fontSize: 58,
    strokeWidth: 0,
    shadow: 20,
    overlayOpacity: 0.5,
    blur: 1,
  },
  {
    id: "classic",
    label: "Classic Mushaf",
    textColor: "#f8f1de",
    highlightColor: "#c9a44a",
    fontSize: 62,
    strokeWidth: 1,
    shadow: 14,
    overlayOpacity: 0.55,
    blur: 0,
  },
  {
    id: "night",
    label: "Night",
    textColor: "#dde7ff",
    highlightColor: "#9fb8ff",
    fontSize: 56,
    strokeWidth: 0,
    shadow: 24,
    overlayOpacity: 0.55,
    blur: 4,
  },
];
