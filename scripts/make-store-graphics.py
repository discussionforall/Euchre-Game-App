"""Draws the Google Play graphics into store/:

  play-icon-512.png             512x512 store icon (same art as the app icon)
  feature-graphic-1024x500.png  the banner at the top of the store listing

Reuses the card drawing from make-icons.py so everything matches.
Run from the project root:  python3 scripts/make-store-graphics.py
"""

import importlib.util
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
STORE = ROOT / "store"

# make-icons.py has a hyphen in its name, so load it by path.
_spec = importlib.util.spec_from_file_location("make_icons", ROOT / "scripts" / "make-icons.py")
icons = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(icons)

SANS = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
SANS_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
TEXT = (244, 241, 232)
TEXT_DIM = (185, 211, 196)


def play_icon():
    big = 512 * icons.SS
    icon = icons.felt_background(big)
    icon.alpha_composite(icons.fan(big, int(big * 0.36)))
    return icon.resize((512, 512), Image.LANCZOS).convert("RGB")


def jack_fan(card_width):
    """All four Jacks fanned like a hand of cards, on a transparent canvas."""
    cw, ch = card_width, int(card_width * 1.4)
    size = int(cw * 3.4)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    cx, cy = size / 2, size / 2
    # (suit, angle, x offset and y drop in card widths), back to front
    layout = [("spades", 24, -0.72, 0.16), ("hearts", 8, -0.24, 0.02),
              ("clubs", -8, 0.24, 0.02), ("diamonds", -24, 0.72, 0.16)]
    for suit, angle, dx, dy in layout:
        card = icons.draw_card(cw, ch, suit).rotate(angle, resample=Image.BICUBIC, expand=True)
        x = int(cx + dx * cw - card.width / 2)
        y = int(cy + dy * cw - card.height / 2)
        shadow = Image.new("RGBA", card.size, (0, 0, 0, 0))
        shadow.putalpha(card.split()[3].point(lambda a: a * 0.35))
        shadow = shadow.filter(ImageFilter.GaussianBlur(cw * 0.05))
        canvas.alpha_composite(shadow, (x + int(cw * 0.03), y + int(cw * 0.06)))
        canvas.alpha_composite(card, (x, y))
    return canvas


def feature_graphic():
    scale = 2  # draw at 2x, then shrink for smooth edges
    w, h = 1024 * scale, 500 * scale

    # Felt background: the same radial gradient as the icon, cropped to a banner.
    bg = icons.radial_gradient(w, icons.FELT_LIGHT, icons.FELT_DARK).convert("RGBA")
    bg = bg.crop((0, (w - h) // 2, w, (w + h) // 2))

    # The four Jacks on the right.
    fan = jack_fan(int(118 * scale))
    bg.alpha_composite(fan, (int(w * 0.775 - fan.width / 2), int(h * 0.52 - fan.height / 2)))

    # Title and tagline on the left.
    d = ImageDraw.Draw(bg)
    x = 64 * scale
    d.text((x, 150 * scale), "Euchre", font=ImageFont.truetype(icons.FONT, 104 * scale), fill=icons.GOLD + (255,))
    d.text((x + 4 * scale, 290 * scale), "The classic trick-taking",
           font=ImageFont.truetype(SANS_BOLD, 26 * scale), fill=TEXT + (255,))
    d.text((x + 4 * scale, 324 * scale), "card game",
           font=ImageFont.truetype(SANS_BOLD, 26 * scale), fill=TEXT + (255,))
    d.text((x + 4 * scale, 372 * scale), "Call trump · Go alone · Play offline",
           font=ImageFont.truetype(SANS, 19 * scale), fill=TEXT_DIM + (255,))

    return bg.resize((1024, 500), Image.LANCZOS).convert("RGB")


def main():
    STORE.mkdir(exist_ok=True)
    play_icon().save(STORE / "play-icon-512.png")
    feature_graphic().save(STORE / "feature-graphic-1024x500.png")
    print("Wrote store graphics to", STORE)


if __name__ == "__main__":
    main()
