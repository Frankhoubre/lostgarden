#!/usr/bin/env python3
"""Render a webtoon script as one self-contained HTML page (for sharing).

    python3 scripts/webtoon-artifact.py ep1-opening out/lost-garden-webtoon.html

Reads public/webtoon/<slug>/webtoon.json (run scripts/webtoon-export.mjs
first) and mirrors the reader: framed and bleed panels, beat marks, the fall
gradient between worlds, webtoon bubbles with curved tails, SFX and captions.
Panel images are referenced relatively (panels/<id>.<ext>) so the page can be
published next to the panels folder.
"""
import html
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
W = 1080
BG = {"white": "#f6f4ef", "black": "#020409", "abyss": "#020817"}
LOCALE = "fr"

BEAT_FR = {"b1": "Le blanc", "b2": "Les lys", "b3": "Trouve-moi", "b4": "Le noir", "b5": "Le sanctuaire"}
PURPOSE_FR = {
    "p01b": "Case pont : trois pétales sur du blanc, rien d'autre. Le vent de la case précédente continue de tomber avec la page.",
    "p03b": "Contre-champ que le film sous-entend : le dos du heaume, le champ flou devant, la tache rose au loin. Même instant, nouveau cadrage.",
    "p06b": "Un détail avant la seule réplique : la fleur dans ses cheveux et un pétale qui s'envole. La page ralentit pour que « Trouve-moi » arrive seul.",
    "p07b": "Les deux secondes de noir deviennent une case haute presque vide : l'œil tombe avec la page, une première lueur froide annonce le sanctuaire sans rien montrer.",
    "p09b": "Un travelling le long du corps avant les sabatons : le gantelet posé sur la pierre, un champignon qui luit à côté. Rien de nouveau ne se passe, le temps s'étire.",
    "p01": "Lanterne seul dans le blanc. Ouvrir sur lui, pas sur le monde : le blanc devient son état, pas un lieu.",
    "p02": "Les lys de près : la seule couleur chaude de la séquence, et la fleur dont le champ sera fait.",
    "p03": "Le film fait le point du flou vers les deux silhouettes ; ici c'est le défilement qui le fait. La distance entre eux est une distance que le pouce doit parcourir.",
    "p04": "Le visage de Rose, muet. Elle regarde avant de parler.",
    "p05": "Un temps de sol : l'ourlet et les petits pieds. Elle est vraiment là, petite, avant que la colline dise à quel point c'est loin.",
    "p06": "Le plan le plus large : une colline entière, deux points. La moitié haute est vide pour que le défilement passe du temps dans rien avant la réplique.",
    "p07": "La seule réplique. En plan taille pour ne pas répéter le gros plan : la cape, les lys et les lèvres entrouvertes portent le moment.",
    "p08": "Après la chute dans le noir, le présent : le sanctuaire en une case haute. La lumière entre en haut, l'œil descend les rayons jusqu'à l'autel.",
    "p09": "Le premier être vivant : une larve pâle sur une racine, vers l'autel. Petite case pour garder le monde silencieux.",
    "p10": "Dernière image : la rosace au-dessus des pieds du chevalier. La lumière sur un corps qui n'a pas encore bougé. Le réveil commence juste après.",
}


def t(text):
    return text.get(LOCALE, text["en"])


def tc(seconds):
    if seconds is None:
        return "·"
    return f"{int(seconds // 60)}:{seconds % 60:04.1f}"


def render(slug, out_path):
    data = json.loads((ROOT / "public" / "webtoon" / slug / "webtoon.json").read_text())
    pct = lambda px: f"{px / W * 100:.3f}%"
    rows = []
    for i, p in enumerate(data["panels"]):
        pl = data["layout"]["placements"][i]
        prev = data["panels"][i - 1] if i else None
        new_beat = prev is not None and prev["beat_id"] != p["beat_id"]
        world_change = prev is not None and prev["background"] != p["background"]
        gap_style = f"padding-top:{pct(pl['gap_before'])};position:relative"
        if world_change:
            gap_style += f";background:linear-gradient(to bottom,{BG[prev['background']]} 0%,{BG[p['background']]} 38%,{BG[p['background']]} 100%)"
        mark = ""
        if new_beat and not world_change:
            mark = f'<span class="beat-mark {"beat-mark-light" if p["background"] == "white" else ""}"></span>'
        r = [f'<div class="row" style="background:{BG[p["background"]]}">', f'<div class="gap" style="{gap_style}">{mark}</div>']
        frame = "bleed" if p["bleed"] else "framed"
        tone = "on-light" if p["background"] == "white" else "on-dark"
        src = p["image"]["src"].replace(f"/webtoon/{slug}/", "")
        r.append(f'<figure class="panel {frame} {tone}" style="aspect-ratio:{W}/{p["panel_height"]}" data-id="{p["panel_id"]}">')
        r.append(
            f'<img src="{src}" alt="{html.escape(p["description"])}" width="{p["image"]["width"]}" height="{p["image"]["height"]}" '
            f'style="object-position:{p["focal_point"]["x"]}% {p["focal_point"]["y"]}%" loading="{"eager" if i < 2 else "lazy"}" decoding="async">'
        )
        for line in p["dialogue"]:
            a = line["anchor"]
            tail = line.get("tail") if line["style"] != "off" else None
            tail_attr = f' data-tail-x="{tail["x"]}" data-tail-y="{tail["y"]}"' if tail else ""
            r.append(
                f'<div class="lettering"{tail_attr}>'
                f'<svg class="tail tail-under" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d=""></path></svg>'
                f'<div class="bubble bubble-{line["style"]}" style="left:{a["x"]}%;top:{a["y"]}%"><span class="sr">{html.escape(line["speaker"])} : </span>{html.escape(t(line["text"]))}</div>'
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

    notes = []
    for b in data["beats"]:
        ps = [p for p in data["panels"] if p["beat_id"] == b["beat_id"]]
        n = [f'<section class="beat"><h3><span class="eyebrow">{tc(b["source_time_start"])} → {tc(b["source_time_end"])}</span>{html.escape(BEAT_FR.get(b["beat_id"], b["title"]))}</h3>']
        if not ps:
            n.append('<p class="muted">Pas de case : deux secondes de noir deviennent 1 400 px de distance, et la page passe du blanc au noir.</p>')
        for p in ps:
            n.append(
                f'<div class="note"><div class="note-head"><b>Case {p["order"]}</b><span>plan {", ".join(p["source_shots"])} · {p["source_time_start"]:.1f} s → {p["source_time_end"]:.1f} s · {p["aspect_ratio"]} · {p["panel_height"]} px</span></div>'
                f'<p>{html.escape(PURPOSE_FR.get(p["panel_id"], p["purpose"]))}</p></div>'
            )
        n.append("</section>")
        notes.append("\n".join(n))

    total = f"{data['layout']['total_height']:,}".replace(",", " ")
    model = next((p["image"].get("model") for p in data["panels"] if p["image"].get("model")), "")
    page = f"""<title>Lost Garden Webtoon</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;700&family=Zen+Kaku+Gothic+New:wght@500;700&family=Nunito:wght@600;800&family=Bangers&display=swap">
<style>
:root{{--abyss:#020817;--cyan:#b9f3ff;--magic:#38bdf8;--ivory:#d8d2c2;--lily:#f8fafc;--ink:#0b0f1a;color-scheme:dark}}
html{{background:var(--abyss)}}
body{{margin:0;background:var(--abyss);color:var(--lily);font-family:"Zen Kaku Gothic New","Hiragino Sans","Yu Gothic",system-ui,sans-serif;font-weight:500;line-height:1.5}}
.wrap{{max-width:720px;margin:0 auto;padding-block:28px 60px;padding-inline:16px}}
.eyebrow{{display:block;font-family:Oswald,"Arial Narrow",sans-serif;font-size:.7rem;letter-spacing:.16em;text-transform:uppercase;color:var(--cyan);margin-bottom:.35rem}}
h1{{font-family:Oswald,"Arial Narrow",sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:.04em;line-height:1.1;font-size:clamp(1.7rem,5vw,2.6rem);margin:0;text-wrap:balance;text-shadow:0 0 32px rgba(125,223,255,.35)}}
.meta{{color:rgba(216,210,194,.65);font-size:.8rem;margin:.6rem 0 0}}
.stage{{margin:26px calc(50% - 50vw) 0}}
@media(min-width:720px){{.stage{{margin:26px auto 0;max-width:720px}}}}
.strip{{width:100%;max-width:1080px;margin:0 auto;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.6)}}
.row,.gap{{width:100%}}
.gap{{position:relative}}
.panel{{position:relative;margin:0;overflow:hidden;container-type:inline-size;max-width:100%}}
.bleed{{width:100%}}
.framed{{width:92%;margin:0 auto;border-radius:clamp(10px,2%,24px)}}
.framed.on-light{{box-shadow:0 0 0 2px rgba(11,15,26,.85),0 18px 40px rgba(6,22,47,.18),0 4px 10px rgba(6,22,47,.12)}}
.framed.on-dark{{box-shadow:0 0 0 2px rgba(185,243,255,.35),0 0 40px rgba(56,189,248,.18),0 18px 40px rgba(0,0,0,.6)}}
.panel img{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;max-width:100%}}
.beat-mark{{position:absolute;left:50%;top:50%;width:12%;height:2px;transform:translate(-50%,-50%);background:linear-gradient(to right,transparent,rgba(185,243,255,.55),transparent)}}
.beat-mark::after{{content:"";position:absolute;left:50%;top:50%;width:7px;height:7px;transform:translate(-50%,-50%) rotate(45deg);background:rgba(185,243,255,.8)}}
.beat-mark-light{{background:linear-gradient(to right,transparent,rgba(11,15,26,.35),transparent)}}
.beat-mark-light::after{{background:rgba(11,15,26,.55)}}
.lettering{{position:absolute;inset:0;pointer-events:none}}
.tail{{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}}
.tail-under{{z-index:1;fill:#fff;stroke:var(--ink);stroke-width:.32;stroke-linejoin:round;vector-effect:non-scaling-stroke}}
.tail-over{{z-index:3;fill:#fff;stroke:none}}
.bubble{{position:absolute;z-index:2;transform:translate(-50%,-50%);min-width:24cqw;max-width:48cqw;padding:3.6cqw 5.2cqw;border-radius:50%;background:#fff;color:var(--ink);border:.3cqw solid var(--ink);font-family:Nunito,"Zen Kaku Gothic New",sans-serif;font-weight:800;font-size:3.4cqw;line-height:1.25;text-align:center;text-wrap:balance;letter-spacing:.01em;box-shadow:.5cqw .7cqw 0 rgba(11,15,26,.14)}}
.bubble-whisper{{border-color:#7b8190;border-width:.22cqw;font-weight:600;color:#3a3f4d;letter-spacing:.08em;box-shadow:none}}
.lettering:has(.bubble-whisper) .tail-under{{stroke:#7b8190;stroke-width:.24}}
.bubble-thought{{border-style:dotted;border-width:.4cqw}}
.bubble-shout{{border-radius:1.2cqw;font-family:Bangers,Oswald,sans-serif;font-weight:400;font-size:5cqw;letter-spacing:.08em;transform:translate(-50%,-50%) rotate(-3deg)}}
.bubble-off{{border-radius:.8cqw;border-width:.2cqw;font-style:italic;font-weight:600;min-width:0}}
.caption{{position:absolute;max-width:60cqw;padding:1.6cqw 2.4cqw;background:rgba(2,8,23,.88);color:var(--ivory);font-family:Nunito,sans-serif;font-weight:600;font-size:2.8cqw;line-height:1.35;border-radius:.6cqw;pointer-events:none}}
.sfx{{position:absolute;font-family:Bangers,Oswald,"Arial Narrow",sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#fff;white-space:nowrap;pointer-events:none;paint-order:stroke fill;-webkit-text-stroke:.9cqw var(--ink);text-shadow:.5cqw .6cqw 0 rgba(11,15,26,.35)}}
.sfx-soft{{text-transform:lowercase;color:#eaf9ff;-webkit-text-stroke:.55cqw rgba(11,15,26,.8);opacity:.9;text-shadow:none}}
.sfx-rumble{{color:var(--cyan);letter-spacing:.16em;-webkit-text-stroke:.7cqw rgba(2,8,23,.9);text-shadow:0 0 1.6cqw rgba(56,189,248,.6),.4cqw .5cqw 0 rgba(2,8,23,.6)}}
.sr{{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}}
h2{{font-family:Oswald,"Arial Narrow",sans-serif;text-transform:uppercase;letter-spacing:.05em;font-size:1.4rem;margin:56px 0 4px}}
.lead{{color:rgba(216,210,194,.8);font-size:.9rem;max-width:60ch;margin:0}}
.beat{{margin-top:28px}}
.beat h3{{font-family:Oswald,"Arial Narrow",sans-serif;text-transform:uppercase;letter-spacing:.05em;font-size:1.05rem;margin:0 0 10px}}
.note{{border-left:2px solid rgba(56,189,248,.4);background:rgba(6,22,47,.55);padding:.7rem .9rem;margin-top:10px}}
.note-head{{display:flex;flex-wrap:wrap;gap:.3rem .8rem;align-items:baseline;font-size:.75rem;color:rgba(216,210,194,.6)}}
.note-head b{{font-family:Oswald,sans-serif;font-size:.9rem;color:var(--lily);letter-spacing:.05em}}
.note p,.muted{{margin:.35rem 0 0;font-size:.9rem;color:rgba(248,250,252,.88)}}
.muted{{color:rgba(216,210,194,.7)}}
.foot{{margin-top:40px;font-size:.75rem;color:rgba(216,210,194,.55)}}
</style>
<div class="wrap">
<span class="eyebrow">Lost Garden · Épisode 1 · ouverture, 0:00 à 0:30</span>
<h1>The Awakening of the Lantern Knight</h1>
<p class="meta">{len(data["panels"])} cases · {total} px de haut sur 1080 px de large · lettrage en français</p>
<div class="stage"><div class="strip" role="list" aria-label="Webtoon">
{chr(10).join(rows)}
</div></div>
<h2>Pourquoi chaque case existe</h2>
<p class="lead">Chaque case vient d'un plan du film. Le découpage est celui du moteur d'adaptation : mêmes plans, même ordre, une mise en scène pensée pour le défilement.</p>
{"".join(notes)}
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
  measure();window.addEventListener("resize",measure);window.addEventListener("load",measure);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(measure);
  if(window.ResizeObserver){{var ro=new ResizeObserver(measure);document.querySelectorAll(".panel").forEach(function(p){{ro.observe(p)}})}}
}})();
</script>
<p class="foot">Adaptation produite par le moteur webtoon de lostgarden.world à partir du proxy de l'épisode, du scénario et des fiches personnages du dépôt de production. Images : GPT Image 2.5 Sunburst ({html.escape(model)}), fiches personnages jointes en premier sur chaque case.</p>
</div>
"""
    Path(out_path).write_text(page, encoding="utf-8")
    print(f"wrote {out_path} ({len(page)} bytes)")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    render(sys.argv[1], sys.argv[2])
