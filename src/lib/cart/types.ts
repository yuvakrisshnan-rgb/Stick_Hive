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
  /** Original uploaded source, kept so background removal can be undone. */
  originalSrc?: string;
  /** True when the local background-removal pass has been applied. */
  backgroundRemoved?: boolean;
  /** True when this layer is locked against drag/resize/rotate/delete. */
  locked?: boolean;
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
  italic?: boolean;
  underline?: boolean;
  /** Drop shadow behind the text glyphs, distinct from the outline/stroke. */
  shadow?: boolean;
  /** Solid pill-shaped backdrop behind the text (quick-style presets). Null
   *  means no backdrop. */
  backgroundColor?: string | null;

  // Optional outline/stroke around the text — the classic bold white
  // sticker-text look. Null/0 means no stroke.
  strokeColor: string | null;
  strokeWidth: number;

  /** True when this layer is locked against drag/resize/rotate/delete. */
  locked?: boolean;
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
  /** Presigned-S3 object containing the flattened print artwork. */
  artworkObjectKey?: string;
  artworkContentType?: string;
};