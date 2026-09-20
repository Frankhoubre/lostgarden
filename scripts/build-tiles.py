"""Build public/game/tiles.png: a 32px autotile sheet cut from the painted ground strip.

Columns 0-15: solid rock, one variant per open-side mask (bit0 up, bit1 right, bit2 down, bit3 left).
Columns 16-19: one-way ledges. Rows: four texture seeds.
"""
from pathlib import Path
from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
g = Image.open(ROOT / "public/game/ground-forest.png").convert("RGBA")
W, H = g.size
T = 32
SURF = 20  # the grass line of the strip sits 2-4px below this row


def crop(y0, i, step=37):
    x = (i * step) % (W - T)
    return g.crop((x, y0, x + T, y0 + T))


def darken(im, f):
    arr = np.asarray(im).astype(float)
    arr[..., :3] *= f
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA")


def shade(im, side, strength, width):
    arr = np.asarray(im).astype(float)
    for k in range(width):
        f = 1 - strength * (1 - k / width)
        if side == "left":
            arr[:, k, :3] *= f
        elif side == "right":
            arr[:, T - 1 - k, :3] *= f
        elif side == "down":
            arr[T - 1 - k, :, :3] *= f
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA")


def moss_rim(im, side, i):
    arr = np.asarray(im).copy()
    rim = np.asarray(crop(SURF + 6, i + 3, 53))
    for k in range(3):
        col = k if side == "left" else T - 1 - k
        src = rim[:, k] if side == "left" else rim[:, T - 1 - k]
        keep = src[:, 3] > 100
        arr[keep, col] = src[keep]
    return Image.fromarray(arr, "RGBA")


sheet = Image.new("RGBA", (T * 20, T * 4), (0, 0, 0, 0))
for seed in range(4):
    for mask in range(16):
        up, right, down, left = mask & 1, mask & 2, mask & 4, mask & 8
        i = seed * 5 + mask
        if up:
            t = crop(SURF, i)
        else:
            t = darken(crop(52, i, 41), 0.8)
        if down:
            t = shade(t, "down", 0.55, 9)
        if left:
            t = moss_rim(shade(t, "left", 0.4, 5), "left", i)
        if right:
            t = moss_rim(shade(t, "right", 0.4, 5), "right", i)
        sheet.paste(t, (mask * T, seed * T))
    for v in range(4):
        i = seed * 4 + v
        plank = crop(SURF, i, 43).crop((0, 0, T, 13))
        t = Image.new("RGBA", (T, T), (0, 0, 0, 0))
        t.paste(plank, (0, 0))
        t = shade(t, "down", 0.6, 5)
        sheet.paste(t, ((16 + v) * T, seed * T))
sheet.save(ROOT / "public/game/tiles.png")
print("tiles", sheet.size)
