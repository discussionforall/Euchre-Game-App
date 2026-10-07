"""Builds store/privacy-policy.html from store/privacy-policy-content.md.

The .md file is the source (it is also what gets pasted into Google Sites),
so edit that and re-run this script to keep the two in sync:

    python3 scripts/make-privacy-page.py

Layout matches the other Sparkle apps' privacy pages.
"""

import html
import re
from pathlib import Path

STORE = Path(__file__).resolve().parent.parent / "store"
RULE = re.compile(r"^[-=]{10,}$")

TEMPLATE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Privacy Policy — {app}</title>
<style>
  :root {{ color-scheme: light; }}
  body {{ margin: 0; padding: 2.5rem 1.25rem 4rem;
    font: 16px/1.65 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #1b2733; background: #f7f9fb; }}
  main {{ max-width: 44rem; margin: 0 auto; background: #fff;
    padding: 2.5rem clamp(1.25rem, 4vw, 3rem); border-radius: 14px;
    box-shadow: 0 1px 3px rgba(16,32,48,.08); }}
  h1 {{ font-size: 1.9rem; margin: 0 0 .25rem; letter-spacing: -.01em; }}
  .meta {{ color: #64748b; font-size: .9rem; margin: 0 0 2rem; }}
  h2 {{ font-size: 1.15rem; margin: 2.25rem 0 .6rem; letter-spacing: -.005em; }}
  p {{ color: #334155; }}
  a {{ color: #2563eb; }}
</style>
</head>
<body>
<main>
  <h1>{title}</h1>
  <p class="meta">{meta}</p>
{body}
</main>
</body>
</html>
"""


def paragraphs(lines):
    """Split lines into paragraphs on blank lines."""
    paras, current = [], []
    for line in lines:
        if line.strip():
            current.append(line.strip())
        elif current:
            paras.append(" ".join(current))
            current = []
    if current:
        paras.append(" ".join(current))
    return paras


def render(text):
    escaped = html.escape(text, quote=True)
    return re.sub(r"([\w.+-]+@[\w-]+\.[\w.]+)", r'<a href="mailto:\1">\1</a>', escaped)


def main():
    source = (STORE / "privacy-policy-content.md").read_text().splitlines()
    # Everything before the first ===== line is notes for whoever publishes it.
    start = next(i for i, line in enumerate(source) if line.startswith("====="))
    blocks, current = [], []
    for line in source[start + 1:]:
        if RULE.match(line.strip()):
            blocks.append(current)
            current = []
        else:
            current.append(line)
    blocks.append(current)
    blocks = [paragraphs(b) for b in blocks if paragraphs(b)]

    title, *meta = blocks[0]
    app = title.split(" — ")[0]
    body = []
    for heading, *paras in blocks[1:]:
        body.append(f"    <h2>{render(heading)}</h2>")
        body.extend(f"    <p>{render(p)}</p>" for p in paras)

    page = TEMPLATE.format(
        app=html.escape(app),
        title=html.escape(title),
        meta=" · ".join(html.escape(m) for m in meta),
        body="\n".join(body),
    )
    (STORE / "privacy-policy.html").write_text(page)
    print("Wrote", STORE / "privacy-policy.html")


if __name__ == "__main__":
    main()
