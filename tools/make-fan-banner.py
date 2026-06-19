#!/usr/bin/env python3
"""Composite a 'מאווררים ומצננים' promo banner matching the sibling promo tiles."""
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from bidi.algorithm import get_display

W = H = 800
PROD = "public/images/products"
OUT = "public/images/banners/promo-fan.png"

FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"

BRAND_RED = (134, 36, 33)
BRAND_RED_DARK = (110, 28, 26)
GOLD = (212, 175, 55)
GOLD_DK = (150, 117, 20)


def he(s):
    return get_display(s)


def font(sz):
    return ImageFont.truetype(FONT_BOLD, sz)


def cut_white(path, t0=26, t1=72):
    """Remove near-white background -> RGBA cutout with feathered alpha."""
    im = Image.open(path).convert("RGB")
    a = np.asarray(im).astype(np.float32)
    dist = np.sqrt(((255 - a) ** 2).sum(axis=2))  # distance from white
    alpha = np.clip((dist - t0) / (t1 - t0), 0, 1) * 255
    rgba = np.dstack([a, alpha]).astype(np.uint8)
    out = Image.fromarray(rgba, "RGBA")
    # trim transparent border
    bbox = out.getbbox()
    return out.crop(bbox) if bbox else out


def fit(img, max_w, max_h):
    r = min(max_w / img.width, max_h / img.height)
    return img.resize((int(img.width * r), int(img.height * r)), Image.LANCZOS)


def soft_shadow(img, blur=14, alpha=110, dy=10):
    sh = Image.new("RGBA", (img.width + blur * 4, img.height + blur * 4), (0, 0, 0, 0))
    a = img.split()[3].point(lambda v: min(v, alpha))
    blk = Image.new("RGBA", img.size, (40, 45, 55, 0))
    blk.putalpha(a)
    sh.paste(blk, (blur * 2, blur * 2 + dy), blk)
    return sh.filter(ImageFilter.GaussianBlur(blur))


# --- background: fresh, cool gradient (evokes airflow / summer) -------------
bg = Image.new("RGB", (W, H))
top = np.array([225, 242, 251])      # cool sky blue
bot = np.array([249, 252, 255])      # near white
grad = (top[None, :] + (bot - top)[None, :] * (np.arange(H)[:, None] / H))
bg = Image.fromarray(np.repeat(grad[:, None, :], W, axis=1).astype(np.uint8), "RGB")

base = bg.convert("RGBA")
draw = ImageDraw.Draw(base)

# subtle airflow swooshes
sw = Image.new("RGBA", (W, H), (0, 0, 0, 0))
sd = ImageDraw.Draw(sw)
for i, y in enumerate(range(120, 360, 34)):
    sd.arc([120 - i * 8, y, 760 + i * 6, y + 240], 200, 330, fill=(120, 180, 220, 60), width=7)
sw = sw.filter(ImageFilter.GaussianBlur(2))
base.alpha_composite(sw)

# soft ground highlight under products
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
gd.ellipse([120, 470, 690, 720], fill=(255, 255, 255, 150))
glow = glow.filter(ImageFilter.GaussianBlur(40))
base.alpha_composite(glow)

# --- products --------------------------------------------------------------
stand = fit(cut_white(f"{PROD}/3388.jpg"), 430, 470)    # stand fan (hero)
cooler = fit(cut_white(f"{PROD}/35871.jpg"), 300, 380)  # portable cooler

# cooler on the right, behind
cx, cy = 470, 715 - cooler.height
base.alpha_composite(soft_shadow(cooler), (cx - 28, cy - 18))
base.alpha_composite(cooler, (cx, cy))

# stand fan on the left, front
sx, sy = 95, 715 - stand.height
base.alpha_composite(soft_shadow(stand), (sx - 28, sy - 18))
base.alpha_composite(stand, (sx, sy))

draw = ImageDraw.Draw(base)

# --- headline (top-right, RTL): two lines, red w/ white stroke -------------
def headline(text, y, size):
    f = font(size)
    t = he(text)
    w = draw.textlength(t, font=f)
    x = W - 40 - w
    draw.text((x, y), t, font=f, fill="white",
              stroke_width=10, stroke_fill="white")
    draw.text((x, y), t, font=f, fill=BRAND_RED,
              stroke_width=3, stroke_fill="white")

headline("מאווררים", 40, 92)
headline("ומצננים", 145, 92)

# --- gold CTA pill ---------------------------------------------------------
cta = he("היכנסו עכשיו ‹")
cf = font(33)
cw = draw.textlength(cta, font=cf)
pad_x, pad_y = 30, 16
pill_w, pill_h = cw + pad_x * 2, 62
px = W - 40 - pill_w
py = 300
draw.rounded_rectangle([px, py, px + pill_w, py + pill_h], radius=pill_h // 2,
                       fill=GOLD, outline=GOLD_DK, width=2)
draw.text((px + pad_x, py + pad_y - 2), cta, font=cf, fill=(60, 40, 0))

# --- bottom subtitle bar ---------------------------------------------------
bar_h = 92
draw.rectangle([0, H - bar_h, W, H], fill=BRAND_RED)
draw.rectangle([0, H - bar_h, W, H - bar_h + 5], fill=GOLD)
sub = he("קרירות מושלמת לאורך כל הקיץ")
sf = font(40)
sw2 = draw.textlength(sub, font=sf)
draw.text(((W - sw2) / 2, H - bar_h + 24), sub, font=sf, fill="white")

base.convert("RGB").save(OUT, "PNG")
print("saved", OUT, base.size)
