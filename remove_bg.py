#!/usr/bin/env python3
"""Remove the solid background from the logo stickers using connected-component
flood fill from the image border. The white sticker outline fully encloses the
character, so the black clothing inside is never touched."""

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage


def remove_background(in_path, out_path, tolerance=40, pad=24):
    img = Image.open(in_path).convert("RGBA")
    arr = np.array(img)
    rgb = arr[:, :, :3].astype(np.int16)
    h, w = rgb.shape[:2]

    # Sample background colour from the four corners (median is robust to noise)
    corners = np.vstack([
        rgb[0:8, 0:8].reshape(-1, 3),
        rgb[0:8, w-8:w].reshape(-1, 3),
        rgb[h-8:h, 0:8].reshape(-1, 3),
        rgb[h-8:h, w-8:w].reshape(-1, 3),
    ])
    bg = np.median(corners, axis=0)

    # Mask of pixels close to the background colour
    dist = np.sqrt(((rgb - bg) ** 2).sum(axis=2))
    bg_like = dist < tolerance

    # Force the outer frame to count as background so JPEG edge artifacts
    # (thin bright lines along an edge) get flood-filled away too.
    k = 3
    bg_like[:k, :] = True
    bg_like[-k:, :] = True
    bg_like[:, :k] = True
    bg_like[:, -k:] = True

    # Label connected regions; keep only those touching the border = real bg
    labels, n = ndimage.label(bg_like)
    border_labels = set(labels[0, :]) | set(labels[-1, :]) | \
                    set(labels[:, 0]) | set(labels[:, -1])
    border_labels.discard(0)
    background = np.isin(labels, list(border_labels))

    # Build alpha: opaque everywhere except detected background
    alpha = np.where(background, 0, 255).astype(np.uint8)
    alpha_img = Image.fromarray(alpha, mode="L")
    # Slight feather to anti-alias the hard flood-fill edge
    alpha_img = alpha_img.filter(ImageFilter.GaussianBlur(0.8))

    final_alpha = np.array(alpha_img)
    out = arr.copy()
    out[:, :, 3] = final_alpha
    result = Image.fromarray(out, mode="RGBA")

    # Crop using a thresholded alpha so faint feather/noise specks don't
    # inflate the bounding box.
    solid = Image.fromarray((final_alpha > 40).astype(np.uint8) * 255, mode="L")
    bbox = solid.getbbox()
    if bbox:
        l, t, r, b = bbox
        l = max(0, l - pad); t = max(0, t - pad)
        r = min(w, r + pad); b = min(h, b + pad)
        result = result.crop((l, t, r, b))

    result.save(out_path)
    print(f"{out_path}: {result.size[0]}x{result.size[1]}")


if __name__ == "__main__":
    base = "attachments/B3C0836C-BE37-4EAB-938D-DC1C7D729F5D"
    remove_background(f"{base}_darkmode.jpeg", "assets/logo-dark.png", tolerance=75)
    remove_background(f"{base}_lightmode.jpeg", "assets/logo-light.png", tolerance=45)
