import type { Product, StickerSize } from "@/lib/product-data";

export type CartLine = {
  productId: string;
  size: StickerSize;
  quantity: number;
};

export type CartLineDetailed = CartLine & {
  product: Product;
  unitPrice: number;
  originalUnitPrice?: number;
  lineTotal: number;
  lineDiscount: number;
};

export type CustomStickerShape =
  | "Circle"
  | "Square"
  | "Rounded"
  | "Die-cut";

export type CustomStickerFinish =
  | "Glossy"
  | "Matte"
  | "Holographic"
  | "Transparent";

// ============================================================================
// STICKER LAYERS
// ============================================================================

export type StickerImageLayer = {
  id: string;
  type: "image";
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  contourPoints: { x: number; y: number }[] | null;
};

export type StickerTextLayer = {
  id: string;
  type: "text";
  text: string;
  x: number;
  y: number;
  width: number;
  rotation: number;
  fontFamily: string;
  fontSize: number;
  fill: string;
  fontWeight: "normal" | "bold";
  align: "left" | "center" | "right";

  // Optional outline/stroke around the text — the classic bold white
  // sticker-text look. Null/0 means no stroke.
  strokeColor: string | null;
  strokeWidth: number;
};

export type StickerLayer = StickerImageLayer | StickerTextLayer;

export type CustomStickerCartLine = {
  type: "custom";
  id: string;
  layers: StickerLayer[];
  size: StickerSize;
  shape: CustomStickerShape;
  finish: CustomStickerFinish;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  thumbnailUrl: string;
};