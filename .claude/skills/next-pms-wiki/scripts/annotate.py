#!/usr/bin/env python3
"""Annotation engine for the Next PMS wiki (adapted from fse-screenshot-annotate).

Draws highlight-red #E00000 boxes + numbered white-on-red corner circles onto CLEAN
SPA screenshots. Idempotent: always reads the pristine source, so re-tuning coords and
re-running never stacks boxes. Box coords are in SOURCE-image pixel space; for the SPA
they equal getBoundingClientRect() coords because we capture at 1440x900, dpr=1 (1:1).

PARALLEL-SAFE: box configs live in per-slug JSON files under configs/<slug>.json, so
many subagents building different pages never touch a shared file. Each JSON maps
variant -> {stroke,radius,cr,font_size,halo?, boxes:[{n,xy:[x0,y0,x1,y1],corner?,cr?,place?,halo?}]}.

RUN:
  export ANNOTATE_SHOTS=/root/next-pms-wiki-build/clean-sources     # <slug>-<variant>.png
  export ANNOTATE_OUT=/root/next-pms-wiki-build/wiki/public         # -> <slug>/<slug>-<variant>.png
  export ANNOTATE_FONT=/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf
  python3 annotate.py                       # every configs/*.json
  python3 annotate.py timesheet-personal    # one slug (loads only configs/timesheet-personal.json)
  python3 annotate.py timesheet-personal-overview   # one slug-variant
"""
import glob
import json
import os
import sys
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
CONFIG_DIR = os.path.join(HERE, "configs")
SHOTS = os.environ.get("ANNOTATE_SHOTS", "/root/next-pms-wiki-build/clean-sources")
WT = os.environ.get("ANNOTATE_OUT", "/root/next-pms-wiki-build/wiki/public")
FONT_PATH = os.environ.get("ANNOTATE_FONT", "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf")

RED = (224, 0, 0)
WHITE = (255, 255, 255)
# Outward gutter (px) added around every box so the border never clips the control's own
# text/glyphs. Measure the TIGHT control bounds via getBoundingClientRect; the engine pads
# outward by this — do NOT pre-pad the coords yourself. Env/per-box (`pad`) overridable.
PAD = int(os.environ.get("ANNOTATE_PAD", "6"))


def corner_xy(x0, y0, x1, y1, corner, cr, place):
    if place == "center":
        pts = {"tl": (x0, y0), "tr": (x1, y0), "bl": (x0, y1), "br": (x1, y1)}
    else:  # inside
        pad = cr + 3
        pts = {"tl": (x0 + pad, y0 + pad), "tr": (x1 - pad, y0 + pad),
               "bl": (x0 + pad, y1 - pad), "br": (x1 - pad, y1 - pad)}
    return pts[corner]


def annotate(slug, variant, cfg):
    stroke = cfg.get("stroke", 3)
    radius = cfg.get("radius", 8)
    cr = cfg.get("cr", 15)
    font_size = cfg.get("font_size", 22)
    halo_all = cfg.get("halo", False)
    boxes = cfg["boxes"]
    src = f"{SHOTS}/{slug}-{variant}.png"
    dst = f"{WT}/{slug}/{slug}-{variant}.png"
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    im = Image.open(src).convert("RGB")
    W, H = im.size
    d = ImageDraw.Draw(im)
    font = ImageFont.truetype(FONT_PATH, font_size)
    for b in boxes:
        x0, y0, x1, y1 = b["xy"]
        pad = b.get("pad", PAD)
        # Inset the border OUTWARD by pad so it never sits on the control's own text; clamp to image.
        x0 = max(0, x0 - pad); y0 = max(0, y0 - pad)
        x1 = min(W - 1, x1 + pad); y1 = min(H - 1, y1 + pad)
        rad = b.get("radius", radius)
        if halo_all or b.get("halo"):
            d.rounded_rectangle([x0, y0, x1, y1], radius=rad, outline=WHITE, width=stroke + 3)
        d.rounded_rectangle([x0, y0, x1, y1], radius=rad, outline=RED, width=stroke)
        bcr = b.get("cr", cr)
        cx, cy = corner_xy(x0, y0, x1, y1, b.get("corner", "tr"), bcr, b.get("place", "center"))
        cx = min(max(cx, bcr + 2), W - bcr - 2)
        cy = min(max(cy, bcr + 2), H - bcr - 2)
        d.ellipse([cx - bcr, cy - bcr, cx + bcr, cy + bcr], fill=RED, outline=WHITE, width=max(2, stroke - 1))
        num = str(b["n"])
        tb = d.textbbox((0, 0), num, font=font)
        tw, th = tb[2] - tb[0], tb[3] - tb[1]
        d.text((cx - tw / 2 - tb[0], cy - th / 2 - tb[1]), num, fill=WHITE, font=font)
    im.save(dst)
    print(f"  wrote {slug}-{variant}  ({len(boxes)} boxes)  {W}x{H}")


def load_slug(slug):
    path = os.path.join(CONFIG_DIR, f"{slug}.json")
    with open(path) as f:
        return json.load(f)


def main():
    only = sys.argv[1] if len(sys.argv) > 1 else None
    if only:
        slug = only.split("-")[0] if False else only  # placeholder; resolved below
        # `only` is either "<slug>" or "<slug>-<variant>"; find which config file it belongs to
        want_variant = None
        cfgfile = os.path.join(CONFIG_DIR, f"{only}.json")
        if os.path.exists(cfgfile):
            slug = only
        else:
            # split slug-variant: the slug is the longest prefix with a config file
            parts = only.split("-")
            slug = None
            for i in range(len(parts), 0, -1):
                cand = "-".join(parts[:i])
                if os.path.exists(os.path.join(CONFIG_DIR, f"{cand}.json")):
                    slug = cand
                    want_variant = "-".join(parts[i:]) or None
                    break
            if slug is None:
                print(f"no config for '{only}' in {CONFIG_DIR}")
                return
        data = load_slug(slug)
        for variant, cfg in data.items():
            if want_variant and variant != want_variant:
                continue
            annotate(slug, variant, cfg)
        return
    for path in sorted(glob.glob(os.path.join(CONFIG_DIR, "*.json"))):
        slug = os.path.splitext(os.path.basename(path))[0]
        with open(path) as f:
            data = json.load(f)
        for variant, cfg in data.items():
            annotate(slug, variant, cfg)


if __name__ == "__main__":
    print("Rendering annotations...")
    main()
    print("Done.")
