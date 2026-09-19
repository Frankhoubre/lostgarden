"""
Builds the pixel-art assets of the Lost Garden game mockup from the
production artwork kept in the private lost-garden repository.

  python3 scripts/build-game-assets.py /path/to/lost-garden

Outputs go to public/game/. Nothing here runs at build time.

  python3 scripts/build-game-assets.py --fetch --generated   # generated pixel-art assets
"""
import json
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

SRC = Path(sys.argv[1] if len(sys.argv) > 1 else "/home/user/lost-garden")
OUT = Path(__file__).resolve().parent.parent / "public" / "game"
OUT.mkdir(parents=True, exist_ok=True)

VIEW_H = 288


def feather_patch(img: Image.Image, dst_box, src_box, feather=18):
    """Clone-stamp src_box over dst_box with a feathered mask."""
    src = img.crop(src_box).resize((dst_box[2] - dst_box[0], dst_box[3] - dst_box[1]), Image.LANCZOS)
    w, h = src.size
    mask = Image.new("L", (w, h), 0)
    inner = Image.new("L", (max(1, w - 2 * feather), max(1, h - 2 * feather)), 255)
    mask.paste(inner, (feather, feather))
    mask = mask.filter(ImageFilter.GaussianBlur(feather / 2))
    img.paste(src, (dst_box[0], dst_box[1]), mask)


def quantize(img: Image.Image, colors: int) -> Image.Image:
    rgb = img.convert("RGB")
    q = rgb.quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    return q.convert("RGB")


BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]], dtype=float) / 16.0 - 0.5


def ordered_quantize(img: Image.Image, colors: int, strength: float) -> Image.Image:
    """Median-cut palette plus a Bayer 4x4 ordered dither: the classic 16-bit texture."""
    rgb = img.convert("RGB")
    pal_img = rgb.quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    pal = np.array(pal_img.getpalette()[: colors * 3]).reshape(-1, 3).astype(float)
    a = np.asarray(rgb).astype(float)
    h, w, _ = a.shape
    tile = np.tile(BAYER, (h // 4 + 1, w // 4 + 1))[:h, :w]
    a = a + tile[..., None] * strength
    flat = a.reshape(-1, 3)
    out = np.empty(flat.shape[0], dtype=np.int64)
    step = 65536
    for i in range(0, flat.shape[0], step):
        chunk = flat[i : i + step]
        d = ((chunk[:, None, :] - pal[None, :, :]) ** 2).sum(axis=2)
        out[i : i + step] = d.argmin(axis=1)
    return Image.fromarray(pal[out].reshape(h, w, 3).astype(np.uint8), "RGB")


def clean_pixel_art(img: Image.Image, colors: int) -> Image.Image:
    rgb = img.convert("RGB")
    rgb = ImageEnhance.Contrast(rgb).enhance(1.1)
    rgb = ImageEnhance.Color(rgb).enhance(1.15)
    rgb = rgb.filter(ImageFilter.UnsharpMask(radius=1, percent=120, threshold=1))
    return ordered_quantize(rgb, colors, 5)


def build_forest_background():
    frame = Image.open(SRC / "08_Storyboard/EP1/prod/EP1_05m15s.jpg").convert("RGB")
    # Remove Lanterne (centre bottom) and the machine (centre back) with clone patches.
    feather_patch(frame, (520, 330, 690, 520), (720, 330, 890, 520), feather=22)
    feather_patch(frame, (500, 130, 830, 300), (860, 130, 1190, 300), feather=26)
    feather_patch(frame, (560, 300, 720, 350), (900, 300, 1060, 350), feather=14)
    # Denoise the JPEG before shrinking, then shrink with area averaging.
    frame = frame.filter(ImageFilter.MedianFilter(3))
    scale = VIEW_H / frame.height
    w = int(round(frame.width * scale))
    small = frame.resize((w, VIEW_H), Image.LANCZOS)
    bg = clean_pixel_art(small, 64)
    bg.save(OUT / "bg-forest.png", optimize=True)

    # Near ground strip (parallax 1) with a feathered top edge so it melts into the far layer.
    ground_top = 186
    strip = bg.crop((0, ground_top, w, VIEW_H)).convert("RGBA")
    ga = np.asarray(strip).copy()
    feather = 30
    for y in range(feather):
        ga[y, :, 3] = int(255 * (y / feather) ** 1.4)
    Image.fromarray(ga, "RGBA").save(OUT / "ground-forest.png", optimize=True)

    # Foreground trunks: the painted trunks at both edges of the frame, inner edge feathered.
    def trunk(x0, x1, feather_side):
        crop = bg.crop((x0, 0, x1, VIEW_H)).convert("RGBA")
        ta = np.asarray(crop).copy()
        fw = 26
        for i in range(fw):
            a = int(255 * (i / fw) ** 1.2)
            col = (x1 - x0 - 1 - i) if feather_side == "right" else i
            ta[:, col, 3] = np.minimum(ta[:, col, 3], a)
        # Softer feather on the outer edge too, so the crop never shows a straight cut.
        ow = 12
        for i in range(ow):
            a = int(255 * (i / ow) ** 1.5)
            col = i if feather_side == "right" else (x1 - x0 - 1 - i)
            ta[:, col, 3] = np.minimum(ta[:, col, 3], a)
        # Darken slightly so it reads as closer than the play layer.
        ta[..., :3] = (ta[..., :3] * 0.72).astype(np.uint8)
        return Image.fromarray(ta, "RGBA")

    trunk(0, 104, "right").save(OUT / "fg-trunk-left.png", optimize=True)
    trunk(w - 66, w, "left").save(OUT / "fg-trunk-right.png", optimize=True)

    # Detect the glowing mushrooms: bright cyan blobs.
    a = np.asarray(bg).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mask = (b > 190) & (g > 175) & (b + g > 2 * r + 60) & ((r + g + b) > 480)
    lights = []
    seen = np.zeros(mask.shape, dtype=bool)
    H, W = mask.shape
    for y in range(H):
        for x in range(W):
            if not mask[y, x] or seen[y, x]:
                continue
            q = deque([(y, x)])
            seen[y, x] = True
            pts = []
            while q:
                cy, cx = q.popleft()
                pts.append((cy, cx))
                for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
                    if 0 <= ny < H and 0 <= nx < W and mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        q.append((ny, nx))
            if len(pts) < 5:
                continue
            ys = [p[0] for p in pts]
            xs = [p[1] for p in pts]
            lights.append({
                "x": round(float(np.mean(xs)), 1),
                "y": round(float(np.mean(ys)), 1),
                "r": round(6 + len(pts) ** 0.5 * 2.2, 1),
            })
    lights.sort(key=lambda l: -l["r"])
    (OUT / "bg-forest.json").write_text(json.dumps({"width": w, "height": VIEW_H, "groundTop": ground_top, "feetY": 262, "lights": lights[:120]}))
    print("background", w, "x", VIEW_H, "lights:", len(lights))


def key_white(img: Image.Image) -> Image.Image:
    """Turn a white studio background into transparency with soft edges."""
    rgba = img.convert("RGBA")
    a = np.asarray(rgba).astype(float)
    mn = a[..., :3].min(axis=2)
    sat = a[..., :3].max(axis=2) - mn
    # White-ish pixels (very bright, low saturation) become transparent.
    alpha = np.clip((252 - mn) / 22.0, 0, 1)
    alpha = np.where((sat < 14) & (mn > 230), alpha, 1.0)
    a[..., 3] = alpha * 255
    return Image.fromarray(a.astype(np.uint8), "RGBA")


def split_views(img: Image.Image):
    """Split a model sheet into its views using empty (white) columns."""
    a = np.asarray(img.convert("RGB")).astype(int)
    col_dark = (a.min(axis=2) < 235).sum(axis=0)
    views = []
    in_view = False
    start = 0
    for x, c in enumerate(col_dark):
        if c > 2 and not in_view:
            in_view = True
            start = x
        elif c <= 2 and in_view:
            in_view = False
            if x - start > 40:
                views.append((start, x))
    if in_view:
        views.append((start, len(col_dark)))
    return views


def pixelize_sprite(rgba: Image.Image, height: int, colors: int, outline=(11, 11, 18)) -> Image.Image:
    bbox = rgba.getbbox()
    crop = rgba.crop(bbox)
    scale = height / crop.height
    w = max(1, int(round(crop.width * scale)))
    # Premultiply before resampling to avoid white halos.
    arr = np.asarray(crop).astype(float)
    alpha = arr[..., 3:4] / 255.0
    prem = np.concatenate([arr[..., :3] * alpha, arr[..., 3:4]], axis=2)
    prem_img = Image.fromarray(prem.astype(np.uint8), "RGBA").resize((w, height), Image.LANCZOS)
    p = np.asarray(prem_img).astype(float)
    a = p[..., 3:4] / 255.0
    rgb = np.where(a > 0, p[..., :3] / np.maximum(a, 1e-3), 0)
    rgb = np.clip(rgb, 0, 255).astype(np.uint8)
    hard = (p[..., 3] > 110).astype(np.uint8)
    rgb_img = Image.fromarray(rgb, "RGB")
    rgb_img = ImageEnhance.Contrast(rgb_img).enhance(1.1)
    q = rgb_img.quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    out = np.zeros((height + 2, w + 2, 4), dtype=np.uint8)
    out[1:-1, 1:-1, :3] = np.asarray(q)
    out[1:-1, 1:-1, 3] = hard * 255
    # 1px outline around the silhouette.
    solid = out[..., 3] > 0
    ring = np.zeros_like(solid)
    for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        shifted = np.zeros_like(solid)
        ys = slice(max(0, dy), solid.shape[0] + min(0, dy))
        yd = slice(max(0, -dy), solid.shape[0] + min(0, -dy))
        xs = slice(max(0, dx), solid.shape[1] + min(0, dx))
        xd = slice(max(0, -dx), solid.shape[1] + min(0, -dx))
        shifted[yd, xd] = solid[ys, xs]
        ring |= shifted
    ring &= ~solid
    out[ring, :3] = outline
    out[ring, 3] = 235
    # Rim light: brighten pixels whose upper neighbour is empty.
    up_empty = np.zeros_like(solid)
    up_empty[1:, :] = ~solid[:-1, :]
    rim = solid & up_empty
    out[rim, :3] = np.clip(out[rim, :3].astype(int) + 34, 0, 255).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def build_lanterne():
    sheet = Image.open(SRC / "09_Fiches_modeles/lanterne.png")
    views = split_views(sheet)
    print("lanterne views:", views)
    keyed = key_white(sheet)
    names = ["front", "side", "back"]
    meta = {}
    for name, (x0, x1) in zip(names, views[:3]):
        view = keyed.crop((x0, 0, x1, sheet.height))
        spr = pixelize_sprite(view, 76, 28)
        spr.save(OUT / f"lanterne-{name}.png", optimize=True)
        meta[name] = {"w": spr.width, "h": spr.height}
        print(name, spr.size)
    (OUT / "lanterne.json").write_text(json.dumps(meta))


if __name__ == "__main__" and "--generated" not in sys.argv:
    build_forest_background()
    build_lanterne()


# ---------------------------------------------------------------------------
# Generated pixel-art assets (Higgsfield / GPT Image), re-sampled to 1:1 pixels
# ---------------------------------------------------------------------------

GEN = Path(__file__).resolve().parent.parent / ".game-assets-src"
MANIFEST = Path(__file__).resolve().parent / "game-assets-manifest.json"


def fetch_generated():
    """Download the generated source images listed in the manifest (not committed: ~26 MB)."""
    import urllib.request

    GEN.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(MANIFEST.read_text())
    for local, remote in manifest["files"].items():
        dest = GEN / local
        if dest.exists():
            continue
        print("fetching", local)
        urllib.request.urlretrieve(manifest["base"] + remote, dest)


def detect_lights(bg: Image.Image, limit=140):
    a = np.asarray(bg.convert("RGB")).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mask = (b > 200) & (g > 170) & (b + g > 2 * r + 80) & ((r + g + b) > 500)
    lights = []
    seen = np.zeros(mask.shape, dtype=bool)
    H, W = mask.shape
    for y in range(H):
        for x in range(W):
            if not mask[y, x] or seen[y, x]:
                continue
            q = deque([(y, x)])
            seen[y, x] = True
            pts = []
            while q:
                cy, cx = q.popleft()
                pts.append((cy, cx))
                for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
                    if 0 <= ny < H and 0 <= nx < W and mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        q.append((ny, nx))
            if len(pts) < 4:
                continue
            ys = [p[0] for p in pts]
            xs = [p[1] for p in pts]
            lights.append({"x": round(float(np.mean(xs)), 1), "y": round(float(np.mean(ys)), 1), "r": round(6 + len(pts) ** 0.5 * 2.4, 1)})
    lights.sort(key=lambda l: -l["r"])
    return lights[:limit]


def build_generated_forest(bg_name="bg2", ground_name="ground1", lanterne_name="lan2"):
    target_w = 512
    # Backdrop: resample close to its native pixel grid, then re-quantise.
    bg = Image.open(GEN / f"{bg_name}.png").convert("RGB")
    h = int(round(bg.height * target_w / bg.width))
    small = bg.resize((target_w, h), Image.LANCZOS)
    small = quantize(small, 48)
    if small.height > VIEW_H:
        small = small.crop((0, small.height - VIEW_H, target_w, small.height))
    small.save(OUT / "bg-forest.png", optimize=True)

    # Ground strip with alpha.
    gr = Image.open(GEN / f"{ground_name}.png").convert("RGBA")
    gh = int(round(gr.height * target_w / gr.width))
    gs = gr.resize((target_w, gh), Image.LANCZOS)
    ga = np.asarray(gs).copy()
    ga[..., 3] = np.where(ga[..., 3] > 110, 255, 0)
    rgb = Image.fromarray(ga[..., :3], "RGB")
    rgb = quantize(rgb, 40)
    ga[..., :3] = np.asarray(rgb)
    cover = (ga[..., 3] > 0).mean(axis=1)
    top = int(np.argmax(cover > 0.85))  # first row where the ground is solid: the walkable line
    first = int(np.argmax(cover > 0.02))  # first row with any content (mushroom caps)
    crop = ga[first:, :, :]
    Image.fromarray(crop, "RGBA").save(OUT / "ground-forest.png", optimize=True)
    ground_meta = {"top": top - first, "height": crop.shape[0]}

    # Lanterne: keyed sprite scaled to ~90px.
    lan = Image.open(GEN / f"{lanterne_name}.png").convert("RGBA")
    la = np.asarray(lan).copy()
    la[..., 3] = np.where(la[..., 3] > 120, 255, 0)
    lan = Image.fromarray(la, "RGBA")
    bbox = lan.getbbox()
    lan = lan.crop(bbox)
    height = 90
    w = int(round(lan.width * height / lan.height))
    prem = np.asarray(lan).astype(float)
    alpha = prem[..., 3:4] / 255.0
    pm = np.concatenate([prem[..., :3] * alpha, prem[..., 3:4]], axis=2)
    small_l = Image.fromarray(pm.astype(np.uint8), "RGBA").resize((w, height), Image.LANCZOS)
    p = np.asarray(small_l).astype(float)
    a = p[..., 3:4] / 255.0
    rgbl = np.clip(np.where(a > 0, p[..., :3] / np.maximum(a, 1e-3), 0), 0, 255).astype(np.uint8)
    q = Image.fromarray(rgbl, "RGB").quantize(colors=32, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    out = np.zeros((height, w, 4), dtype=np.uint8)
    out[..., :3] = np.asarray(q)
    out[..., 3] = np.where(p[..., 3] > 110, 255, 0)

    lights = detect_lights(small)
    ground_lights = detect_lights(Image.fromarray(crop[..., :3], "RGB"), limit=80)
    meta = {
        "width": target_w,
        "height": VIEW_H,
        "ground": ground_meta,
        "lights": lights,
        "groundLights": ground_lights,
        "lanterne": {"w": w, "h": height},
    }
    (OUT / "bg-forest.json").write_text(json.dumps(meta))
    print("generated forest:", small.size, "ground", ground_meta, "lanterne", (w, height), "lights", len(lights), len(ground_lights))


if __name__ == "__main__" and "--fetch" in sys.argv:
    fetch_generated()

if __name__ == "__main__" and "--generated" in sys.argv:
    build_generated_forest()


def slice_sheet(path: Path, gap_min=6):
    """Split a horizontal sprite sheet into frames using transparent column gaps."""
    img = Image.open(path).convert("RGBA")
    a = np.asarray(img)
    solid = a[..., 3] > 120
    cols = solid.any(axis=0)
    frames = []
    x = 0
    W = len(cols)
    while x < W:
        if not cols[x]:
            x += 1
            continue
        start = x
        while x < W and (cols[x] or (x + gap_min < W and cols[x : x + gap_min].any())):
            x += 1
        end = x
        sub = solid[:, start:end]
        rows = np.where(sub.any(axis=1))[0]
        if len(rows) == 0 or end - start < 40:
            continue
        frames.append(img.crop((start, int(rows[0]), end, int(rows[-1]) + 1)))
    return frames


def slice_equal(path: Path, n: int):
    """Split a sheet into n frames: connected components assigned to the cell holding their centre."""
    from scipy import ndimage

    img = Image.open(path).convert("RGBA")
    a = np.asarray(img).copy()
    solid = a[..., 3] > 120
    cols = np.where(solid.any(axis=0))[0]
    x0, x1 = int(cols[0]), int(cols[-1]) + 1
    cell = (x1 - x0) / n
    # Dilate so limbs separated by an outline gap still count as one body.
    labels, count = ndimage.label(ndimage.binary_dilation(solid, iterations=6))
    frames = []
    for i in range(n):
        cx0 = x0 + i * cell
        cx1 = x0 + (i + 1) * cell
        keep = np.zeros_like(solid)
        best_size = 0
        for lab in range(1, count + 1):
            comp = labels == lab
            ys, xs = np.where(comp)
            cx = xs.mean()
            if cx0 <= cx < cx1:
                size = comp.sum()
                if size > best_size:
                    best_size = size
                    keep = comp
        m = keep & solid
        ys, xs = np.where(m)
        fa = a.copy()
        fa[..., 3] = np.where(m, fa[..., 3], 0)
        frames.append(Image.fromarray(fa, "RGBA").crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)))
    return frames


def build_strip(name: str, frames, scale: float, cell_w: int, cell_h: int, palette_img: Image.Image, colors=32, prefix="lanterne", align="bottom"):
    """Scale frames uniformly, quantise to a shared palette, bottom-centre them in fixed cells."""
    strip = Image.new("RGBA", (cell_w * len(frames), cell_h), (0, 0, 0, 0))
    for i, fr in enumerate(frames):
        w = max(1, int(round(fr.width * scale)))
        h = max(1, int(round(fr.height * scale)))
        arr = np.asarray(fr).astype(float)
        alpha = arr[..., 3:4] / 255.0
        pm = np.concatenate([arr[..., :3] * alpha, arr[..., 3:4]], axis=2)
        small = Image.fromarray(pm.astype(np.uint8), "RGBA").resize((w, h), Image.LANCZOS)
        p = np.asarray(small).astype(float)
        al = p[..., 3:4] / 255.0
        rgb = np.clip(np.where(al > 0, p[..., :3] / np.maximum(al, 1e-3), 0), 0, 255).astype(np.uint8)
        q = Image.fromarray(rgb, "RGB").quantize(palette=palette_img, dither=Image.Dither.NONE).convert("RGB")
        out = np.zeros((h, w, 4), dtype=np.uint8)
        out[..., :3] = np.asarray(q)
        out[..., 3] = np.where(p[..., 3] > 110, 255, 0)
        cell = Image.fromarray(out, "RGBA")
        x = i * cell_w + (cell_w - w) // 2
        y = cell_h - h
        strip.paste(cell, (x, y), cell)
    strip.save(OUT / f"{prefix}-{name}.png", optimize=True)
    return len(frames)


def build_generated_lanterne():
    walk = slice_sheet(GEN / "walk2.png")
    jump = slice_sheet(GEN / "jump1.png")
    idle = slice_sheet(GEN / "idle1.png")
    print("frames:", len(walk), len(jump), len(idle))
    target_h = 90
    cell_w, cell_h = 56, 96
    scale_walk = target_h / max(f.height for f in walk)
    scale_idle = target_h / max(f.height for f in idle)
    # The push-off frame of the jump is close to full height.
    scale_jump = target_h / max(f.height for f in jump) * 0.98
    # Shared palette from the idle sheet.
    idle_rgb = Image.open(GEN / "idle1.png").convert("RGBA")
    ia = np.asarray(idle_rgb)
    mask = ia[..., 3] > 120
    pixels = ia[mask][:, :3]
    pal_src = Image.fromarray(pixels.reshape(1, -1, 3), "RGB")
    palette_img = pal_src.quantize(colors=32, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    n_walk = build_strip("walk", walk, scale_walk, cell_w, cell_h, palette_img)
    n_jump = build_strip("jump", jump, scale_jump, cell_w, cell_h, palette_img)
    n_idle = build_strip("idle", idle, scale_idle, cell_w, cell_h, palette_img)
    # Throw: the glowing ball in frame 3 is part of the art; keep it but widen the cells.
    throw = slice_equal(GEN / "throw1.png", 5)
    hurt = slice_sheet(GEN / "hurt1.png")
    scale_throw = target_h / max(f.height for f in throw)
    scale_hurt = target_h / max(f.height for f in hurt)
    n_throw = build_strip("throw", throw, scale_throw, 72, cell_h, palette_img)
    n_hurt = build_strip("hurt", hurt, scale_hurt, cell_w, cell_h, palette_img)
    print("throw/hurt frames:", n_throw, n_hurt)
    meta = {"cell": {"w": cell_w, "h": cell_h}, "walk": n_walk, "jump": n_jump, "idle": n_idle, "throw": n_throw, "throwCellW": 72, "hurt": n_hurt}
    (OUT / "lanterne-anim.json").write_text(json.dumps(meta))

    # Foreground trunk.
    tr = Image.open(GEN / "trunk1.png").convert("RGBA")
    h = VIEW_H
    w = int(round(tr.width * h / tr.height))
    arr = np.asarray(tr).astype(float)
    alpha = arr[..., 3:4] / 255.0
    pm = np.concatenate([arr[..., :3] * alpha, arr[..., 3:4]], axis=2)
    small = Image.fromarray(pm.astype(np.uint8), "RGBA").resize((w, h), Image.LANCZOS)
    p = np.asarray(small).astype(float)
    al = p[..., 3:4] / 255.0
    rgb = np.clip(np.where(al > 0, p[..., :3] / np.maximum(al, 1e-3), 0), 0, 255).astype(np.uint8)
    q = Image.fromarray(rgb, "RGB").quantize(colors=20, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    out = np.zeros((h, w, 4), dtype=np.uint8)
    out[..., :3] = np.asarray(q)
    out[..., 3] = np.where(p[..., 3] > 110, 255, 0)
    Image.fromarray(out, "RGBA").save(OUT / "fg-trunk.png", optimize=True)
    print("trunk", (w, h), "anim", meta)


if __name__ == "__main__" and "--generated" in sys.argv:
    build_generated_lanterne()


def build_generated_reptile():
    """The pale reptilian: walk, attack, hurt+death strips, same 90px scale as Lanterne."""
    base = Image.open(GEN / "reptile1.png").convert("RGBA")
    ba = np.asarray(base)
    mask = ba[..., 3] > 120
    pal_src = Image.fromarray(ba[mask][:, :3].reshape(1, -1, 3), "RGB")
    palette_img = pal_src.quantize(colors=28, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    walk = slice_equal(GEN / "rwalk1.png", 6)
    attack = slice_equal(GEN / "rattack1.png", 5)
    die = slice_equal(GEN / "rdie1.png", 6)
    print("reptile frames:", len(walk), len(attack), len(die))
    # Scale everything from the standing walk frames so the creature keeps one size across sheets.
    ref_h = max(f.height for f in walk)
    scale = 96 / ref_h
    cell_h = 100
    n_walk = build_strip("walk", walk, scale, 80, cell_h, palette_img, prefix="reptile")
    n_attack = build_strip("attack", attack, scale, 96, cell_h, palette_img, prefix="reptile")
    n_die = build_strip("die", die, scale, 96, cell_h, palette_img, prefix="reptile")
    meta = {"cell": {"h": cell_h}, "walk": {"n": n_walk, "w": 80}, "attack": {"n": n_attack, "w": 96}, "die": {"n": n_die, "w": 96}}
    (OUT / "reptile-anim.json").write_text(json.dumps(meta))
    print("reptile", meta)


if __name__ == "__main__" and "--generated" in sys.argv:
    build_generated_reptile()
