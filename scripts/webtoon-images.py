#!/usr/bin/env python3
"""Register generated panel images for a webtoon script.

    python3 scripts/webtoon-images.py ep1-opening jobs.json

`jobs.json` maps panel ids to generation results:
    {"p01": {"url": "https://…png", "job_id": "…", "model": "nano_banana_pro"}, …}

The images are downloaded to public/webtoon/<slug>/panels/<panel>.jpg (JPEG,
quality 90, capped at 1080 px wide, which is the canvas), and
lib/webtoon/sources/<slug>.images.ts is rewritten so the engine attaches them.
Re-run after any regeneration; panels missing from jobs.json keep their entry.
"""
import json
import re
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
CANVAS = 1080


def main() -> None:
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    slug, jobs_path = sys.argv[1], Path(sys.argv[2])
    jobs = json.loads(jobs_path.read_text())
    out_dir = ROOT / "public" / "webtoon" / slug / "panels"
    out_dir.mkdir(parents=True, exist_ok=True)
    ts_path = ROOT / "lib" / "webtoon" / "sources" / f"{slug}.images.ts"

    existing: dict[str, dict] = {}
    if ts_path.exists():
        m = re.search(r"= (\{.*\});", ts_path.read_text(), re.S)
        if m:
            try:
                existing = json.loads(m.group(1))
            except json.JSONDecodeError:
                existing = {}

    for panel_id, job in sorted(jobs.items()):
        src = job["url"]
        target = out_dir / f"{panel_id}.jpg"
        if src.startswith("http"):
            data = urllib.request.urlopen(src, timeout=120).read()
            tmp = out_dir / f"{panel_id}.download"
            tmp.write_bytes(data)
            image = Image.open(tmp)
        else:
            image = Image.open(src)
        image = image.convert("RGB")
        if image.width > CANVAS:
            image = image.resize((CANVAS, round(image.height * CANVAS / image.width)), Image.LANCZOS)
        image.save(target, "JPEG", quality=90, optimize=True, progressive=True)
        (out_dir / f"{panel_id}.download").unlink(missing_ok=True)
        existing[panel_id] = {
            "src": f"/webtoon/{slug}/panels/{panel_id}.jpg",
            "width": image.width,
            "height": image.height,
            "model": job.get("model", ""),
            "job_id": job.get("job_id", ""),
            "generated_at": job.get("generated_at") or datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "status": "generated",
        }
        print(f"{panel_id}: {image.width}x{image.height} → {target.relative_to(ROOT)}")

    const_name = re.sub(r"[^A-Za-z0-9]+", "_", slug).upper()
    body = json.dumps(dict(sorted(existing.items())), indent=2, ensure_ascii=False)
    ts_path.write_text(
        'import type { PanelImage } from "../types";\n\n'
        "/** Generated panel images. Written by scripts/webtoon-images.py; edit there. */\n"
        f"export const EP1_OPENING_IMAGES: Record<string, PanelImage> = {body};\n"
        if slug == "ep1-opening"
        else 'import type { PanelImage } from "../types";\n\n'
        "/** Generated panel images. Written by scripts/webtoon-images.py; edit there. */\n"
        f"export const {const_name}_IMAGES: Record<string, PanelImage> = {body};\n"
    )
    print(f"wrote {ts_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
