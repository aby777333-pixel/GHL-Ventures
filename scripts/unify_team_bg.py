"""One-off: rebuild every team headshot in public/images/team/ with the
SAME background — a studio-style charcoal radial gradient — so the
About page grid feels consistent. Uses rembg (u2net_human_seg) for the
mask, Pillow for the composite."""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
from rembg import remove, new_session

TEAM_DIR = Path(r"C:/Users/GIO4X/Documents/GHL Brand New/GHL/GHL-Ventures-Main/public/images/team")
PHOTOS = [
    "bennet-j.jpg",
    "p-harish-kumar.jpg",
    "padmanabhan-n.jpg",
    "raj-kumar.jpg",
    "senthil-kumar.jpg",
    "Abe-Abrams.jpg",
]

# Target output is a 4:5 portrait (matches the .aspect-[4/5] CSS frame on /about)
OUT_W, OUT_H = 800, 1000

# Studio gradient — radial soft light, charcoal palette to blend with the dark
# About page cards. Center is slightly warmer/lighter to act like a key light;
# edges are deep slate so the silhouette has separation.
CENTER = (58, 58, 64)   # warmer charcoal
EDGE = (16, 18, 22)     # near-black slate


def make_studio_bg(w: int, h: int) -> Image.Image:
    """Smooth radial gradient from CENTER to EDGE, with a soft floor shadow."""
    bg = Image.new("RGB", (w, h), EDGE)
    cx, cy = w // 2, int(h * 0.42)  # light origin slightly above center
    max_r = (w**2 + h**2) ** 0.5

    px = bg.load()
    for y in range(h):
        for x in range(w):
            d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            t = min(d / (max_r * 0.55), 1.0)
            # ease-out cubic for smoother falloff
            t = 1 - (1 - t) ** 3
            r = int(CENTER[0] * (1 - t) + EDGE[0] * t)
            g = int(CENTER[1] * (1 - t) + EDGE[1] * t)
            b = int(CENTER[2] * (1 - t) + EDGE[2] * t)
            px[x, y] = (r, g, b)
    return bg


def fit_subject(subject_rgba: Image.Image, bbox, frame_w: int, frame_h: int) -> Image.Image:
    """Return a frame-sized RGBA where the subject is scaled+centered.

    The bbox (left, top, right, bottom) is the tight box around the visible
    subject pixels. Scale so the subject's height = ~92% of the frame height
    and the subject sits resting near the bottom (head room above).
    """
    cropped = subject_rgba.crop(bbox)
    sw, sh = cropped.size
    target_h = int(frame_h * 0.92)
    scale = target_h / sh
    new_w = max(1, int(sw * scale))
    new_h = max(1, int(sh * scale))
    cropped = cropped.resize((new_w, new_h), Image.LANCZOS)

    canvas = Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
    x = (frame_w - new_w) // 2
    y = frame_h - new_h - int(frame_h * 0.04)  # 4% bottom margin
    canvas.alpha_composite(cropped, (x, y))
    return canvas


def soft_floor_shadow(w: int, h: int) -> Image.Image:
    """Subtle ground shadow under the subject — adds groundedness."""
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    # ellipse shadow, anchored to bottom center
    cx, cy = w // 2, int(h * 0.96)
    rx, ry = int(w * 0.40), int(h * 0.025)
    draw.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=(0, 0, 0, 120))
    return layer.filter(ImageFilter.GaussianBlur(18))


def process_one(src_path: Path, session) -> None:
    print(f"  processing {src_path.name} ...", flush=True)
    raw = Image.open(src_path).convert("RGBA")

    cutout = remove(raw, session=session)
    bbox = cutout.getbbox()
    if bbox is None:
        print(f"  WARNING: no subject found in {src_path.name}, skipping")
        return

    bg = make_studio_bg(OUT_W, OUT_H).convert("RGBA")
    bg.alpha_composite(soft_floor_shadow(OUT_W, OUT_H))
    subject = fit_subject(cutout, bbox, OUT_W, OUT_H)
    bg.alpha_composite(subject)

    out_jpg = src_path.with_suffix(".jpg")
    bg.convert("RGB").save(out_jpg, "JPEG", quality=88, optimize=True, progressive=True)
    print(f"  -> {out_jpg.name}  ({out_jpg.stat().st_size // 1024} KB)")


def main() -> None:
    session = new_session("u2net_human_seg")
    for name in PHOTOS:
        p = TEAM_DIR / name
        if not p.exists():
            print(f"  MISSING: {p}")
            continue
        process_one(p, session)
    print("done.")


if __name__ == "__main__":
    main()
