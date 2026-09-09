# Stick Hive — Custom Sticker / Die-cut Revamp

## What changed
- Die-cut no longer pretends an opaque image has a usable silhouette.
- Transparent PNG artwork gets its real alpha contour.
- Added a dependency-free local background remover for simple/flat backgrounds.
- Added `Make Die-cut Ready` and `Restore original image` controls in Image Settings.
- Multi-layer die-cut outlines are combined from detected image contours + text bounds.
- If the artwork is still opaque, the canvas shows a muted editor guide instead of a fake physical cutline.
- Existing Circle, Square and Rounded modes remain unchanged.

## Background removal limitation
The local remover is intentionally lightweight. It flood-fills edge-connected pixels that are close to the image-corner background colour. It is suitable for simple/flat backgrounds, graphics and product-style artwork. It is not an AI segmentation model and should not be treated as perfect for complex photography.

## User flow
1. Upload PNG/JPG/WEBP.
2. Select the image layer.
3. Choose Die-cut.
4. For transparent PNGs, the cutline is generated automatically.
5. For opaque images, click `Make Die-cut Ready`.
6. Review the cutline before adding to cart.
