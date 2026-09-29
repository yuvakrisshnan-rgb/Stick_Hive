# Stick Hive — Custom Sticker / Die-cut Pipeline

This describes what actually ships today. The original version of this doc
described a dependency-free flood-fill background remover as the primary
path — that's no longer accurate; flood-fill is now a manual fallback, not
the default.

## Background removal

Two separate implementations exist, used for different purposes:

- **Automatic ML pass on upload** (`removeBackgroundML`, `@imgly/background-removal`)
  — runs immediately after every image upload, before die-cut contour
  detection, so most photos get a real silhouette instead of a rectangular
  fallback. In-browser WebAssembly, no server round-trip. Always uses the
  `fast` model (`isnet_quint8`, ~40MB, quantized) on this automatic pass,
  regardless of the precision toggle described below.

- **"Re-run AI Background Removal"** (Image Settings panel, shown once a
  layer has `originalSrc`) — re-runs the same ML model against the
  original upload, this time honoring a **Fast / High precision** toggle:
  - `fast` — `isnet_quint8`, quicker, good for most photos (the default,
    same model the automatic pass always uses).
  - `high` — `isnet` (full fp32, no quantization), a larger one-time model
    download and a few extra seconds of inference, for cleaner edges on
    hard subjects like hair or reflective glass.
  Both variants share the same fixed 1024×1024 model input resolution —
  precision is the only quality lever this library exposes, not output
  resolution.

- **"Make Die-cut Ready"** (Image Settings panel, shown only when the
  current layer has no usable `contourPoints` yet — i.e. the automatic ML
  pass didn't produce one) — the **dependency-free flood-fill fallback**
  (`removeSimpleBackground`), not the ML model. Removes background-colored
  pixels connected to the image edges, sampled from the four corners.
  Intentionally lightweight: suitable for simple/flat backgrounds and
  graphic artwork, not a substitute for the ML model on real photography.
  This is what the original version of this doc described as the primary
  remover — it's now a secondary, manual-trigger fallback.

- **"Restore original image"** — discards any background-removal result
  and reverts the layer to the untouched upload (`originalSrc`).

## Mask post-processing (`mask-postprocess.ts`)

Runs automatically after every ML pass (both the automatic upload pass and
an explicit re-run), unless explicitly disabled. Fixes two common ML
artifacts at high-contrast edges (hair, jewelry, glass rims), plus one
optional third pass:

1. **Erosion** — a small min-filter on the alpha channel, shrinking away a
   thin fringe of residual-background pixels the model classified as
   "mostly foreground" but that visibly still read as background (a
   "halo").
2. **Feathering** — a light box-blur on the alpha channel only (RGB
   untouched, so the artwork itself is never softened) to smooth a jagged,
   aliased alpha edge that would otherwise read poorly once downscaled
   onto a small sticker.
3. **Decontamination** — removes background-*color* bleed from
   semi-transparent edge pixels themselves, not just their alpha. A real
   photo's edge pixel color is a blend of foreground and background
   (`observed = alpha*fg + (1-alpha)*bg`); left as-is, that blend shows up
   as a fringe of the original photo's background color once the sticker
   sits on a differently-colored surface. Estimates the local background
   color via a push-pull fill from confirmed-background pixels (normalized
   convolution) and solves the same equation for the true foreground color.

Separately, `cleanupBackgroundHoles` fills small enclosed alpha holes
(flecks in hair, specks on fabric) directly in the visible image data, not
just the abstract contour-tracing mask — otherwise the die-cut outline
could look clean while the rendered artwork/thumbnail still shows holes.

## Manual eraser (`image-eraser-modal.tsx`)

A plain HTML5 canvas tool (not Konva — this only needs pointer-driven pixel
erasing on one static image) for refining a background-removal result by
hand, opened from the selection pill toolbar's Erase icon. Three tools,
not just hard erase:

- **Erase** — full-opacity `destination-out`, for clean cutouts.
- **Soft Erase** — `destination-out` with a radial-gradient brush (opaque
  center, transparent edge) for feathering by hand where the AI left a
  hard or blurry edge.
- **Restore** — paints back from a pristine copy of the image captured on
  load (`source-over`, clipped to the brush shape), independent of the
  undo stack, so an over-erased spot can be fixed without walking back
  through every prior stroke.

Round or square brush, several brush sizes, and a **zoom** control (CSS
display size only — the canvas's own pixel buffer, and therefore erase
precision, stays at native resolution) for fine detail work like hair or
jewelry chains. Editing here re-triggers die-cut contour detection on save,
same as any other background-removal path.

## Die-cut contour detection (`contour.ts`)

Unchanged from the original approach: traces the actual silhouette of an
image layer's alpha channel (marching-squares-style boundary walk +
Douglas-Peucker simplification), so Die-cut mode hugs the real artwork
outline instead of a generic shape. An opaque image with no usable
transparency has no edge to trace — Die-cut needs a transparent PNG (via
either background-removal path above, or a manual eraser pass) before it
can compute one; there's no fake cutline fallback. Multi-layer designs
combine each image layer's contour plus text-layer bounds into one convex
hull (`getDieCutPoints`), so Die-cut mode works correctly across several
layers, not just a single image.

## Shape clipping — Circle, Square, Rounded, Die-cut all genuinely cut now

Previously, none of the four shape modes actually clipped anything —
"shape" was purely a decorative border stroke plus a dashed on-screen
guide; the underlying artwork/background always rendered as a full,
opaque, uncropped square, both on-screen and in the exported print
artwork. A print vendor received a flat square PNG with nothing in the
file itself to cut by, for every shape, not just Die-cut.

Fixed: the print-area background and all layers now render inside a Konva
`clipFunc` group, using the same boundary geometry the border stroke and
dashed guide already computed (a circle for Circle, an inset rect for
Square/Rounded, the die-cut contour's convex hull for Die-cut). Since
Konva's `stage.toDataURL()` respects that clip, the exported PNG is now a
real alpha-transparent cutout matching the selected shape — not just a
correctly-shaped on-screen preview. Any standard sticker vendor's
alpha-trace cutting workflow now has real transparency to cut along, for
all four shapes.

## User flow

1. Upload PNG/JPG/WEBP.
2. The ML model automatically removes the background (fast model) and
   contour detection runs against the result.
3. If that didn't produce a clean edge, use **Make Die-cut Ready**
   (flood-fill fallback) or **Re-run AI Background Removal** at **High
   precision**, or open the **manual eraser** to fix it by hand.
4. Choose a shape (Circle/Square/Rounded/Die-cut) — the canvas now
   genuinely clips to it, on-screen and in the final print export.
5. Review the cutline before adding to cart.
