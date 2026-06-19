#!/usr/bin/env python3
"""Generate a maskable PWA icon: full-bleed red gradient square with the white
bolt scaled into the central 80% safe zone (prevents launcher cropping and
forces Chrome to re-mint a clean WebAPK)."""
from PIL import Image, ImageDraw
import os
PUB = os.path.join(os.path.dirname(__file__), "..", "public")
BOLT_64 = [(37,8),(16,35),(28,35),(25,56),(48,25),(35,25),(39,8)]
TOP=(0x96,0x1a,0x1a); BOT=(0x6e,0x12,0x12); WHITE=(255,255,255)
def render(size=512, safe=0.74):
    ss=4; S=size*ss
    img=Image.new("RGB",(S,S),TOP)
    grad=Image.new("RGB",(1,S))
    for y in range(S):
        t=y/max(1,S-1)
        grad.putpixel((0,y),(round(TOP[0]+(BOT[0]-TOP[0])*t),
                             round(TOP[1]+(BOT[1]-TOP[1])*t),
                             round(TOP[2]+(BOT[2]-TOP[2])*t)))
    img=grad.resize((S,S))
    d=ImageDraw.Draw(img)
    # scale bolt toward center (32,32) so it sits inside the safe zone
    pts=[(32+(x-32)*safe, 32+(y-32)*safe) for (x,y) in BOLT_64]
    pts=[(px/64*S, py/64*S) for (px,py) in pts]
    d.polygon(pts, fill=WHITE)
    return img.resize((size,size), Image.LANCZOS)
render(512).save(os.path.join(PUB,"icon-maskable-512.png"))
render(192).save(os.path.join(PUB,"icon-maskable-192.png"))
print("maskable icons generated")
