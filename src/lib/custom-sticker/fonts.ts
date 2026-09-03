// ============================================================================
// STICKER TEXT FONTS
// ============================================================================
// Curated set of fonts available in the text tool. Actual font files are
// loaded via @fontsource in layout.tsx — this file just maps display
// labels to the CSS font-family names Konva will render with.

export type StickerFont = {
  id: string;
  label: string;
  fontFamily: string;
  previewWeight: "normal" | "bold";
};

export const STICKER_FONTS: StickerFont[] = [
  {
    id: "inter",
    label: "Clean Sans",
    fontFamily: "Inter Variable, Inter, sans-serif",
    previewWeight: "normal",
  },
  {
    id: "space-grotesk",
    label: "Bold Display",
    fontFamily: "Space Grotesk, sans-serif",
    previewWeight: "bold",
  },
  {
    id: "poppins",
    label: "Rounded Sans",
    fontFamily: "Poppins, sans-serif",
    previewWeight: "normal",
  },
  {
    id: "playfair",
    label: "Elegant Serif",
    fontFamily: "Playfair Display, serif",
    previewWeight: "bold",
  },
  {
    id: "caveat",
    label: "Handwriting",
    fontFamily: "Caveat, cursive",
    previewWeight: "bold",
  },
  {
    id: "jetbrains-mono",
    label: "Monospace",
    fontFamily: "JetBrains Mono, monospace",
    previewWeight: "normal",
  },
];

export const DEFAULT_STICKER_FONT = STICKER_FONTS[0];