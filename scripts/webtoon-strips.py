#!/usr/bin/env python3
"""Export a webtoon script as flat, lettered image strips for publishing platforms.

    python3 scripts/webtoon-strips.py ep1-opening [en fr ja ko] [--out DIR]

For each locale: renders a strip-only HTML page (1080 px wide, lettering in
that language, no header, no notes, no beat marks), screenshots it with the
installed Google Chrome through playwright-core, then slices the tall image
into per-platform sets:

  webtoon/   800 px wide, pieces <= 1280 px tall, JPG < 2 MB   (WEBTOON Canvas)
  tapas/     940 px wide, pieces <= 2000 px tall, JPG < 2 MB   (Tapas)
  strip/     1080 px wide, pieces <= 2000 px tall, JPG         (GlobalComix, MANGA Plus Creators, archive)
  full.jpg   the whole strip at 1080 px

Default output: ../Lost-Garden-Writing/05_Publication/webtoon-platforms/<slug>/<locale>/
"""
import html
import io
import json
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
W = 1080
BG = {"white": "#f6f4ef", "black": "#020409", "abyss": "#020817"}
DEFAULT_OUT = ROOT.parent / "Lost-Garden-Writing" / "05_Publication" / "webtoon-platforms"

Image.MAX_IMAGE_PIXELS = None


def strip_html(data, slug, locale):
    t = lambda text: text.get(locale) or text["en"]
    pct = lambda px: f"{px / W * 100:.3f}%"
    panels_dir = (ROOT / "public" / "webtoon" / slug).as_uri()
    rows = []
    for i, p in enumerate(data["panels"]):
        pl = data["layout"]["placements"][i]
        prev = data["panels"][i - 1] if i else None
        world_change = prev is not None and prev["background"] != p["background"]
        gap_style = f"padding-top:{pct(pl['gap_before'])};position:relative"
        if world_change:
            gap_style += f";background:linear-gradient(to bottom,{BG[prev['background']]} 0%,{BG[p['background']]} 38%,{BG[p['background']]} 100%)"
        r = [f'<div class="row" style="background:{BG[p["background"]]}">', f'<div class="gap" style="{gap_style}"></div>']
        frame = "bleed" if p["bleed"] else "framed"
        tone = "on-light" if p["background"] == "white" else "on-dark"
        src = p["image"]["src"]
        if src.startswith(f"/webtoon/{slug}/"):
            src = panels_dir + "/" + src[len(f"/webtoon/{slug}/"):]
        r.append(f'<figure class="panel {frame} {tone}" style="aspect-ratio:{W}/{p["panel_height"]}" data-id="{p["panel_id"]}">')
        r.append(
            f'<img src="{src}" alt="" width="{p["image"]["width"]}" height="{p["image"]["height"]}" '
            f'style="object-position:{p["focal_point"]["x"]}% {p["focal_point"]["y"]}%" decoding="sync">'
        )
        for line in p["dialogue"]:
            a = line["anchor"]
            tail = line.get("tail") if line["style"] != "off" else None
            tail_attr = f' data-tail-x="{tail["x"]}" data-tail-y="{tail["y"]}"' if tail else ""
            r.append(
                f'<div class="lettering"{tail_attr}>'
                f'<svg class="tail tail-under" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d=""></path></svg>'
                f'<div class="bubble bubble-{line["style"]}" style="left:{a["x"]}%;top:{a["y"]}%">{html.escape(t(line["text"]))}</div>'
                f'<svg class="tail tail-over" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d=""></path></svg>'
                "</div>"
            )
        for box in p["caption"]:
            r.append(f'<div class="caption caption-{box["style"]}" style="left:{box["anchor"]["x"]}%;top:{box["anchor"]["y"]}%">{html.escape(t(box["text"]))}</div>')
        for fx in p["sfx"]:
            size = (fx.get("size", 96) / W) * 100
            r.append(
                f'<div class="sfx sfx-{fx["style"]}" style="left:{fx["anchor"]["x"]}%;top:{fx["anchor"]["y"]}%;'
                f'transform:translate(-50%,-50%) rotate({fx.get("rotate", 0)}deg);font-size:{size:.2f}cqw" aria-hidden="true">{html.escape(t(fx["text"]))}</div>'
            )
        r.append("</figure>")
        r.append(f'<div class="gap" style="padding-top:{pct(pl["gap_after"])}"></div></div>')
        rows.append("\n".join(r))

    return f"""<!doctype html><html lang="{locale}"><meta charset="utf-8"><title>strip</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=Zen+Kaku+Gothic+New:wght@500;700&family=Nunito:wght@600;800&family=Bangers&family=Noto+Sans+JP:wght@500;700&family=Noto+Sans+KR:wght@500;700&display=swap">
<style>
:root{{--abyss:#020817;--cyan:#b9f3ff;--ink:#0b0f1a;--ivory:#d8d2c2}}
html,body{{margin:0;padding:0;background:{BG[data["panels"][0]["background"]]}}}
.strip{{width:{W}px;margin:0;overflow:hidden}}
.row,.gap{{width:100%}}
.gap{{position:relative}}
.panel{{position:relative;margin:0;overflow:hidden;container-type:inline-size;max-width:100%}}
.bleed{{width:100%}}
.framed{{width:92%;margin:0 auto;border-radius:clamp(10px,2%,24px)}}
.framed.on-light{{box-shadow:0 0 0 2px rgba(11,15,26,.85),0 18px 40px rgba(6,22,47,.18),0 4px 10px rgba(6,22,47,.12)}}
.framed.on-dark{{box-shadow:0 0 0 2px rgba(185,243,255,.35),0 0 40px rgba(56,189,248,.18),0 18px 40px rgba(0,0,0,.6)}}
.panel img{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;max-width:100%}}
.lettering{{position:absolute;inset:0;pointer-events:none}}
.tail{{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}}
.tail-under{{z-index:1;fill:#fff;stroke:var(--ink);stroke-width:.32;stroke-linejoin:round;vector-effect:non-scaling-stroke}}
.tail-over{{z-index:3;fill:#fff;stroke:none}}
.bubble{{position:absolute;z-index:2;transform:translate(-50%,-50%);min-width:24cqw;max-width:48cqw;padding:3.6cqw 5.2cqw;border-radius:50%;background:#fff;color:var(--ink);border:.3cqw solid var(--ink);font-family:Nunito,"Noto Sans JP","Noto Sans KR","Zen Kaku Gothic New",sans-serif;font-weight:800;font-size:3.4cqw;line-height:1.25;text-align:center;text-wrap:balance;letter-spacing:.01em;box-shadow:.5cqw .7cqw 0 rgba(11,15,26,.14)}}
.bubble-whisper{{border-color:#7b8190;border-width:.22cqw;font-weight:600;color:#3a3f4d;letter-spacing:.08em;box-shadow:none}}
.lettering:has(.bubble-whisper) .tail-under{{stroke:#7b8190;stroke-width:.24}}
.bubble-thought{{border-style:dotted;border-width:.4cqw}}
.bubble-shout{{border-radius:1.2cqw;font-family:Bangers,Oswald,sans-serif;font-weight:400;font-size:5cqw;letter-spacing:.08em;transform:translate(-50%,-50%) rotate(-3deg)}}
.bubble-off{{border-radius:.8cqw;border-width:.2cqw;font-style:italic;font-weight:600;min-width:0}}
.caption{{position:absolute;max-width:60cqw;padding:1.6cqw 2.4cqw;background:rgba(2,8,23,.88);color:var(--ivory);font-family:Nunito,"Noto Sans JP","Noto Sans KR",sans-serif;font-weight:600;font-size:2.8cqw;line-height:1.35;border-radius:.6cqw;pointer-events:none}}
.sfx{{position:absolute;font-family:Bangers,Oswald,"Noto Sans JP","Noto Sans KR","Arial Narrow",sans-serif;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#fff;white-space:nowrap;pointer-events:none;paint-order:stroke fill;-webkit-text-stroke:.9cqw var(--ink);text-shadow:.5cqw .6cqw 0 rgba(11,15,26,.35)}}
.sfx-soft{{text-transform:lowercase;color:#eaf9ff;-webkit-text-stroke:.55cqw rgba(11,15,26,.8);opacity:.9;text-shadow:none}}
.sfx-rumble{{color:var(--cyan);letter-spacing:.16em;-webkit-text-stroke:.7cqw rgba(2,8,23,.9);text-shadow:0 0 1.6cqw rgba(56,189,248,.6),.4cqw .5cqw 0 rgba(2,8,23,.6)}}
</style>
<div class="strip" id="strip">
{chr(10).join(rows)}
</div>
<script>
(function(){{
  function tailPath(b,t,p){{
    var dx=t.x-b.cx,dy=t.y-b.cy;if(!dx&&!dy)return null;
    var k=1/Math.sqrt(Math.pow(dx/b.rx,2)+Math.pow(dy/b.ry,2));if(k>=0.98)return null;
    var len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len,half=Math.min(p.w*0.032,b.rx*0.45);
    var base={{x:b.cx+dx*k*0.82,y:b.cy+dy*k*0.82}},tip={{x:b.cx+dx*0.9,y:b.cy+dy*0.9}},bow=p.w*0.014;
    var mid={{x:(base.x+tip.x)/2,y:(base.y+tip.y)/2}};
    var q=function(x,y){{return (x/p.w*100).toFixed(2)+" "+(y/p.h*100).toFixed(2)}};
    return "M "+q(base.x+nx*half,base.y+ny*half)+" Q "+q(mid.x+nx*(half*0.55+bow),mid.y+ny*(half*0.55+bow))+" "+q(tip.x,tip.y)+" Q "+q(mid.x-nx*(half*0.55-bow),mid.y-ny*(half*0.55-bow))+" "+q(base.x-nx*half,base.y-ny*half)+" Z";
  }}
  function measure(){{
    document.querySelectorAll(".lettering[data-tail-x]").forEach(function(w){{
      var panel=w.closest(".panel"),el=w.querySelector(".bubble");if(!panel||!el)return;
      var pr=panel.getBoundingClientRect(),br=el.getBoundingClientRect();if(!pr.width||!br.width)return;
      var d=tailPath({{cx:br.left-pr.left+br.width/2,cy:br.top-pr.top+br.height/2,rx:br.width/2,ry:br.height/2}},
        {{x:parseFloat(w.dataset.tailX)/100*pr.width,y:parseFloat(w.dataset.tailY)/100*pr.height}},{{w:pr.width,h:pr.height}});
      w.querySelectorAll(".tail path").forEach(function(path){{path.setAttribute("d",d||"")}});
    }});
  }}
  window.__measure=measure;
  measure();window.addEventListener("load",measure);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(measure);
}})();
</script>
</html>"""


SHOT_JS = r"""
const { chromium } = require(process.argv[2]);
(async () => {
  const [,, , htmlPath, outPath] = process.argv;
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1080, height: 2000 }, deviceScaleFactor: 1 });
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { await document.fonts.ready; await new Promise(r => setTimeout(r, 300)); window.__measure && window.__measure(); });
  const h = await page.evaluate(() => document.getElementById('strip').getBoundingClientRect().height);
  const H = Math.round(h);
  const step = 4000;
  const parts = [];
  for (let y = 0; y < H; y += step) {
    const hh = Math.min(step, H - y);
    const buf = await page.screenshot({ fullPage: true, clip: { x: 0, y, width: 1080, height: hh }, type: 'png' });
    const p = outPath + '.' + String(parts.length).padStart(3, '0') + '.png';
    require('fs').writeFileSync(p, buf);
    parts.push(p);
  }
  console.log(JSON.stringify({ height: H, parts }));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
"""


def screenshot(html_path, out_base):
    pw = ROOT / "node_modules" / "playwright-core"
    js = Path(tempfile.gettempdir()) / "webtoon-strip-shot.js"
    js.write_text(SHOT_JS)
    res = subprocess.run(["node", str(js), str(pw), str(html_path), str(out_base)], capture_output=True, text=True, cwd=ROOT)
    if res.returncode:
        raise SystemExit(res.stderr)
    info = json.loads(res.stdout.strip().splitlines()[-1])
    full = Image.new("RGB", (W, info["height"]))
    y = 0
    for p in info["parts"]:
        im = Image.open(p).convert("RGB")
        full.paste(im, (0, y))
        y += im.height
        Path(p).unlink()
    return full


def save_jpg(im, path, limit=2_000_000):
    for q in (92, 88, 84, 80, 75, 70):
        buf = io.BytesIO()
        im.save(buf, "JPEG", quality=q, optimize=True, progressive=False, subsampling=0 if q >= 88 else 2)
        if buf.tell() <= limit:
            break
    path.write_bytes(buf.getvalue())
    return buf.tell()


def slice_set(full, width, max_h, out_dir, prefix):
    out_dir.mkdir(parents=True, exist_ok=True)
    for f in out_dir.glob("*.jpg"):
        f.unlink()
    im = full if width == full.width else full.resize((width, round(full.height * width / full.width)), Image.LANCZOS)
    n = -(-im.height // max_h)
    h = -(-im.height // n)  # equal pieces, all <= max_h
    sizes = []
    for i in range(n):
        piece = im.crop((0, i * h, width, min((i + 1) * h, im.height)))
        sizes.append(save_jpg(piece, out_dir / f"{prefix}-{i + 1:02d}.jpg"))
    return n, h, max(sizes)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    out_root = DEFAULT_OUT
    if "--out" in sys.argv:
        out_root = Path(sys.argv[sys.argv.index("--out") + 1])
        args = [a for a in args if a != str(out_root)]
    slug, locales = args[0], args[1:] or ["en", "fr", "ja", "ko"]
    data = json.loads((ROOT / "public" / "webtoon" / slug / "webtoon.json").read_text())
    for locale in locales:
        out = out_root / slug / locale
        out.mkdir(parents=True, exist_ok=True)
        html_path = out / "strip.html"
        html_path.write_text(strip_html(data, slug, locale), encoding="utf-8")
        full = screenshot(html_path, out / "shot")
        html_path.unlink()
        save_jpg(full, out / "full.jpg", limit=10**9)
        r1 = slice_set(full, 800, 1280, out / "webtoon", f"lost-garden-ep1-{locale}")
        r2 = slice_set(full, 940, 2000, out / "tapas", f"lost-garden-ep1-{locale}")
        r3 = slice_set(full, 1080, 2000, out / "strip", f"lost-garden-ep1-{locale}")
        print(f"{locale}: {full.width}x{full.height} · webtoon {r1[0]} pieces of {r1[1]} px (max {r1[2] // 1024} KB) · tapas {r2[0]} pieces · strip {r3[0]} pieces → {out}")


if __name__ == "__main__":
    main()
