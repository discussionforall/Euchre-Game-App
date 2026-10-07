"""Draws the app's icon and splash images into assets/.

The design: the two red Jacks (J♥ and J♦, the right and left bowers when
hearts are trump) fanned out on green felt, matching the in-game table.

Run from the project root:  python3 scripts/make-icons.py
Needs Pillow (pip install pillow) and the DejaVu fonts.
"""

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ASSETS = Path(__file__).resolve().parent.parent / "assets"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"

# Same colors as src/ui/theme.ts
FELT_LIGHT = (18, 122, 79)
FELT = (11, 93, 59)
FELT_DARK = (6, 58, 37)
GOLD = (242, 193, 78)
CARD_FACE = (255, 253, 247)
CARD_BORDER = (201, 195, 179)
RED = (200, 38, 47)
BLACK = (27, 27, 27)

SS = 4  # draw everything 4x larger, then shrink, for smooth edges


# ---------------------------------------------------------------------------
# Shapes


def heart_points(cx, cy, size):
    """Classic parametric heart, `size` wide, centred on (cx, cy)."""
    pts = []
    for i in range(200):
        t = 2 * math.pi * i / 200
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        pts.append((cx + x * size / 34, cy - y * size / 34 - size * 0.05))
    return pts


def diamond_points(cx, cy, size):
    w, h = size * 0.38, size * 0.52
    return [(cx, cy - h), (cx + w, cy), (cx, cy + h), (cx - w, cy)]


def draw_suit(draw, suit, cx, cy, size, fill):
    """Draws one suit symbol about `size` wide, centred on (cx, cy)."""
    if suit == "hearts":
        draw.polygon(heart_points(cx, cy, size), fill=fill)
    elif suit == "diamonds":
        draw.polygon(diamond_points(cx, cy, size), fill=fill)
    elif suit == "spades":
        # An upside-down heart with a little flared stem.
        pts = heart_points(cx, cy, size * 0.9)
        draw.polygon([(x, 2 * cy - y - size * 0.12) for x, y in pts], fill=fill)
        draw.polygon([(cx, cy), (cx - size * 0.2, cy + size * 0.5), (cx + size * 0.2, cy + size * 0.5)], fill=fill)
    else:  # clubs: three round leaves and a stem
        r = size * 0.22
        for dx, dy in ((0, -0.22), (-0.24, 0.08), (0.24, 0.08)):
            x, y = cx + dx * size, cy + dy * size
            draw.ellipse([x - r, y - r, x + r, y + r], fill=fill)
        draw.polygon([(cx, cy), (cx - size * 0.2, cy + size * 0.5), (cx + size * 0.2, cy + size * 0.5)], fill=fill)


def radial_gradient(size, inner, outer):
    """A square image fading from `inner` at the centre to `outer` at the corners."""
    small = 256
    img = Image.new("RGB", (small, small))
    px = img.load()
    c = (small - 1) / 2
    max_d = math.hypot(c, c)
    for y in range(small):
        for x in range(small):
            t = min(1.0, math.hypot(x - c, y - c) / max_d) ** 1.4
            px[x, y] = tuple(round(inner[i] + (outer[i] - inner[i]) * t) for i in range(3))
    return img.resize((size, size), Image.BICUBIC)


# ---------------------------------------------------------------------------
# Cards


def draw_card(w, h, suit, mono=False):
    """One Jack of `suit`, w x h pixels. `mono` draws a white card with the
    markings cut out (transparent), for Android's single-colour themed icon."""
    card = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(card)
    radius = int(w * 0.09)
    colour = RED if suit in ("hearts", "diamonds") else BLACK
    ink = (0, 0, 0, 0) if mono else colour + (255,)

    if mono:
        d.rounded_rectangle([0, 0, w - 1, h - 1], radius, fill=(255, 255, 255, 255))
    else:
        d.rounded_rectangle([0, 0, w - 1, h - 1], radius, fill=CARD_FACE + (255,),
                            outline=CARD_BORDER + (255,), width=max(2, w // 90))

    # Corner index: "J" with a small suit underneath, top-left and (upside down) bottom-right.
    index_font = ImageFont.truetype(FONT, int(w * 0.2))
    corner = Image.new("RGBA", (int(w * 0.24), int(w * 0.42)), (0, 0, 0, 0))
    cd = ImageDraw.Draw(corner)
    cd.text((corner.width / 2, 0), "J", font=index_font, fill=(255, 0, 0, 255), anchor="mt")
    draw_suit(cd, suit, corner.width / 2, corner.height * 0.74, w * 0.15, (255, 0, 0, 255))
    mask = corner.split()[3]
    for img, pos in ((mask, (int(w * 0.04), int(w * 0.05))),
                     (mask.rotate(180), (w - corner.width - int(w * 0.04), h - corner.height - int(w * 0.05)))):
        card.paste(Image.new("RGBA", img.size, ink), pos, img)

    # Centre: a big "J" with the suit underneath, readable even when tiny.
    centre = Image.new("L", (w, h), 0)
    md = ImageDraw.Draw(centre)
    md.text((w / 2, h * 0.40), "J", font=ImageFont.truetype(FONT, int(w * 0.54)), fill=255, anchor="mm")
    draw_suit(md, suit, w / 2, h * 0.75, w * 0.28, 255)
    card.paste(Image.new("RGBA", (w, h), ink), (0, 0), centre)
    return card


def fan(canvas_size, card_width, mono=False, shadow=True):
    """The two Jacks fanned out, centred on a transparent square canvas."""
    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    cw = card_width
    ch = int(cw * 1.4)
    cx = cy = canvas_size / 2
    layout = [("diamonds", -16, -0.27), ("hearts", 12, 0.27)]  # (suit, angle, x offset in card widths)

    for suit, angle, dx in layout:
        card = draw_card(cw, ch, suit, mono=mono).rotate(angle, resample=Image.BICUBIC, expand=True)
        x = int(cx + dx * cw - card.width / 2)
        y = int(cy - card.height / 2 + cw * 0.03)
        if mono:
            # One flat colour can't show overlap, so cut a thin gap around the
            # front card to keep the two cards visibly separate.
            gap = card.split()[3].filter(ImageFilter.MaxFilter(_odd(cw * 0.06)))
            cleared = Image.new("L", canvas.size, 0)
            cleared.paste(gap, (x, y))
            r, g, b, a = canvas.split()
            a = Image.composite(Image.new("L", canvas.size, 0), a, cleared)
            canvas = Image.merge("RGBA", (r, g, b, a))
        if shadow and not mono:
            # Soft drop shadow under each card.
            alpha = card.split()[3].point(lambda a: a * 0.3)
            blurred = Image.new("RGBA", card.size, (0, 0, 0, 0))
            blurred.putalpha(alpha)
            blurred = blurred.filter(ImageFilter.GaussianBlur(cw * 0.04))
            canvas.alpha_composite(blurred, (x + int(cw * 0.03), y + int(cw * 0.05)))
        canvas.alpha_composite(card, (x, y))
    return canvas


def _odd(n):
    """MaxFilter needs an odd size."""
    n = max(3, int(n))
    return n if n % 2 else n + 1


def felt_background(size):
    bg = radial_gradient(size, FELT_LIGHT, FELT_DARK).convert("RGBA")
    # A thin gold ring, like the edge of a card table.
    ring = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(ring).ellipse([size * 0.06, size * 0.06, size * 0.94, size * 0.94],
                                 outline=GOLD + (90,), width=int(size * 0.012))
    bg.alpha_composite(ring)
    return bg


def shrink(img, size):
    return img.resize((size, size), Image.LANCZOS)


# ---------------------------------------------------------------------------
# Outputs


def main():
    big = 1024 * SS

    # App icon: full square, no transparency (the OS applies its own mask).
    icon = felt_background(big)
    icon.alpha_composite(fan(big, int(big * 0.36)))
    shrink(icon, 1024).convert("RGB").save(ASSETS / "icon.png")

    # Android adaptive icon. Only the middle 66 of 108 units is always visible,
    # so the cards are smaller and kept inside that safe zone.
    shrink(felt_background(big), 1024).save(ASSETS / "android-icon-background.png")
    shrink(fan(big, int(big * 0.25)), 1024).save(ASSETS / "android-icon-foreground.png")
    shrink(fan(big, int(big * 0.25), mono=True), 1024).save(ASSETS / "android-icon-monochrome.png")

    # Splash: the cards alone on transparent; the green comes from backgroundColor.
    shrink(fan(big, int(big * 0.36)), 1024).save(ASSETS / "splash-icon.png")

    # Web favicon (not used on Android, but keep it matching).
    shrink(icon, 48).convert("RGB").save(ASSETS / "favicon.png")
    print("Wrote icons to", ASSETS)


if __name__ == "__main__":
    main()
