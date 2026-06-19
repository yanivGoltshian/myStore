#!/usr/bin/env python3
"""Generate red+white favicon set (white lightning bolt on red rounded square).
Matches src/app/icon.svg geometry. Supersampled for smooth edges."""
from PIL import Image, ImageDraw
import os

APP = os.path.join(os.path.dirname(__file__), "..", "src", "app")
PUB = os.path.join(os.path.dirname(__file__), "..", "public")

# Bolt polygon in 64x64 space (from SVG path M37 8 16 35h12l-3 21 23-31H35l4-17z)
BOLT_64 = [(37, 8), (16, 35), (28, 35), (25, 56), (48, 25), (35, 25), (39, 8)]
TOP = (0x96, 0x1a, 0x1a)   # #961a1a
BOT = (0x6e, 0x12, 0x12)   # #6e1212
WHITE = (255, 255, 255)
RADIUS_RATIO = 14 / 64


def render(size: int) -> Image.Image:
    ss = 4
    S = size * ss
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))

    # vertical gradient background
    grad = Image.new("RGB", (1, S))
    for y in range(S):
        t = y / max(1, S - 1)
        grad.putpixel((0, y), (
            round(TOP[0] + (BOT[0] - TOP[0]) * t),
            round(TOP[1] + (BOT[1] - TOP[1]) * t),
            round(TOP[2] + (BOT[2] - TOP[2]) * t),
        ))
    grad = grad.resize((S, S))

    # rounded-rect mask
    mask = Image.new("L", (S, S), 0)
    md = ImageDraw.Draw(mask)
    r = round(RADIUS_RATIO * S)
    md.rounded_rectangle([0, 0, S - 1, S - 1], radius=r, fill=255)
    img.paste(grad, (0, 0), mask)

    # white bolt
    d = ImageDraw.Draw(img)
    pts = [(x / 64 * S, y / 64 * S) for (x, y) in BOLT_64]
    d.polygon(pts, fill=WHITE)

    return img.resize((size, size), Image.LANCZOS)


# apple-icon 180
render(180).save(os.path.join(APP, "apple-icon.png"))
# pwa icons
render(512).save(os.path.join(PUB, "icon-512.png"))
render(192).save(os.path.join(PUB, "icon-192.png"))
# favicon.ico multi-size
ico = render(256)
ico.save(os.path.join(APP, "favicon.ico"),
         sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
print("favicon set regenerated (white bolt):",
      "apple-icon.png, favicon.ico, public/icon-512.png, public/icon-192.png")
