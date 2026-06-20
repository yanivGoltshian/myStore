#!/usr/bin/env python3
"""Generate DISTINCT admin PWA icons.

Storefront icon = white background + crimson bolt. To make the installed admin
app recognizable on the home screen, the admin icon is the inverse motif: a
crimson gradient square with a white GEAR (cog) and the lightning bolt seated in
its hub. Emits any + maskable (192/512) and an apple-touch icon (180)."""
import os
import math
from PIL import Image, ImageDraw

PUB = os.path.join(os.path.dirname(__file__), "..", "public")
TOP = (0x96, 0x1a, 0x1a)   # crimson (matches storefront maskable)
BOT = (0x6e, 0x12, 0x12)
WHITE = (255, 255, 255)
# Storefront bolt on a 64-unit grid (centred ~32,32; y 8..56, x 16..48).
BOLT_64 = [(37, 8), (16, 35), (28, 35), (25, 56), (48, 25), (35, 25), (39, 8)]


def gradient(S):
    grad = Image.new("RGB", (1, S))
    for y in range(S):
        t = y / max(1, S - 1)
        grad.putpixel((0, y), (
            round(TOP[0] + (BOT[0] - TOP[0]) * t),
            round(TOP[1] + (BOT[1] - TOP[1]) * t),
            round(TOP[2] + (BOT[2] - TOP[2]) * t),
        ))
    return grad.resize((S, S))


def sc(pt, safe):
    """Scale a 64-grid point toward centre (32,32) by `safe`."""
    x, y = pt
    return (32 + (x - 32) * safe, 32 + (y - 32) * safe)


def render(size, safe):
    ss = 4
    S = size * ss
    unit = S / 64.0
    bg = gradient(S)
    img = bg.copy()
    d = ImageDraw.Draw(img)

    def P(pt):
        x, y = sc(pt, safe)
        return (x * unit, y * unit)

    def circle(cx, cy, r):
        c = sc((cx, cy), safe)
        rr = r * safe
        return [(c[0] - rr) * unit, (c[1] - rr) * unit,
                (c[0] + rr) * unit, (c[1] + rr) * unit]

    # --- white gear teeth (8 rotated trapezoids poking out of the body) ---
    teeth = 8
    r0, r1, tw = 14.5, 23.0, 7.6   # body-overlap radius, tip radius, tooth width
    for k in range(teeth):
        ang = (k / teeth) * 2 * math.pi
        ca, saa = math.cos(ang), math.sin(ang)
        corners = [
            (32 + ca * r0 - saa * (tw / 2), 32 + saa * r0 + ca * (tw / 2)),
            (32 + ca * r1 - saa * (tw * 0.38), 32 + saa * r1 + ca * (tw * 0.38)),
            (32 + ca * r1 + saa * (tw * 0.38), 32 + saa * r1 - ca * (tw * 0.38)),
            (32 + ca * r0 + saa * (tw / 2), 32 + saa * r0 - ca * (tw / 2)),
        ]
        d.polygon([P(c) for c in corners], fill=WHITE)

    # gear body
    d.ellipse(circle(32, 32, 17.5), fill=WHITE)

    # --- crimson hub (gradient shows through the white body) ---
    r_hub = 11.0
    hubmask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(hubmask).ellipse(circle(32, 32, r_hub), fill=255)
    img.paste(bg, (0, 0), hubmask)

    # --- white bolt seated in the hub (scaled toward centre to fit) ---
    boltscale = 0.42
    bolt = [(32 + (x - 32) * boltscale, 32 + (y - 32) * boltscale) for (x, y) in BOLT_64]
    ImageDraw.Draw(img).polygon([P(b) for b in bolt], fill=WHITE)

    return img.resize((size, size), Image.LANCZOS)


# "any" purpose — small padding so the full motif shows.
render(512, 0.92).save(os.path.join(PUB, "admin-icon-512.png"))
render(192, 0.92).save(os.path.join(PUB, "admin-icon-192.png"))
# maskable — inside the 74% safe zone to survive launcher cropping.
render(512, 0.74).save(os.path.join(PUB, "admin-icon-maskable-512.png"))
render(192, 0.74).save(os.path.join(PUB, "admin-icon-maskable-192.png"))
# apple-touch (iOS adds its own rounding) — near full-bleed.
render(180, 0.88).save(os.path.join(PUB, "admin-apple-icon.png"))
print("admin icons generated")
