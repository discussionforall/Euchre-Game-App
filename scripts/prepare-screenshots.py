"""Makes phone screenshots that Google Play accepts.

Play rejects screenshots whose long side is more than twice the short side,
and most modern phones (1080x2424 here) are taller than that. Cropping would
cut off the score bar or your cards, so instead each image is widened to
exactly 2:1 by stretching its own left and right edge pixels outward. The
felt background simply continues, and nothing on screen is lost.

Raw captures go in store/screenshots/raw/, named in the order they should
appear (phone-01-home.png, ...). Run from the project root:

    python3 scripts/prepare-screenshots.py
"""

from pathlib import Path

from PIL import Image

SHOTS = Path(__file__).resolve().parent.parent / "store" / "screenshots"


def widen_to_2_1(img):
    w, h = img.size
    target_w = -(-h // 2)  # ceil(h / 2): long side exactly 2x short side
    if w >= target_w:
        return img
    pad = target_w - w
    left_pad, right_pad = pad // 2, pad - pad // 2
    out = Image.new("RGB", (target_w, h))
    out.paste(img, (left_pad, 0))
    # Stretch the outermost pixel column on each side to fill the margins.
    out.paste(img.crop((0, 0, 1, h)).resize((left_pad, h)), (0, 0))
    out.paste(img.crop((w - 1, 0, w, h)).resize((right_pad, h)), (left_pad + w, 0))
    return out


def main():
    raws = sorted((SHOTS / "raw").glob("*.png"))
    if not raws:
        raise SystemExit(f"No screenshots in {SHOTS / 'raw'}")
    for raw in raws:
        img = widen_to_2_1(Image.open(raw).convert("RGB"))
        img.save(SHOTS / raw.name)
        print(f"{raw.name}: {img.size[0]}x{img.size[1]}")


if __name__ == "__main__":
    main()
