#!/usr/bin/env python3
"""Portrait background replacement CLI - Electron sidecar script.

Usage:
  python3 process_portrait.py --input photo.jpg --output result.jpg --settings-json /tmp/settings.json
  python3 process_portrait.py --check  # Check if InSPyReNet is available

Settings JSON structure:
{
  "mode": "replace",
  "background_type": "preset",
  "preset_name": "charcoal",
  "background_image_path": null,
  "color_r": null, "color_g": null, "color_b": null,
  "gradient_start_r": null, ..., "gradient_direction": "vertical",
  "edge_inset": 2, "feather_radius": 3,
  "decontaminate": true, "decontaminate_strength": 0.8,
  "hair_refinement": true, "hair_refinement_strength": 0.4,
  "edge_smoothing": 2,
  "add_shadow": false, "shadow_opacity": 0.3,
  "darken_amount": 0.7, "target_brightness": 35,
  "output_quality": 95
}
"""

import argparse
import io
import json
import logging
import os
import sys
import time
from pathlib import Path

import numpy as np
from PIL import Image, ImageCms

# Kepmeretkorlat: max 50 megapixel (vedelem image bomb ellen)
Image.MAX_IMAGE_PIXELS = 50_000_000

MAX_BATCH_SIZE = 500

# Engedelyezett utvonal prefixek (defense-in-depth)
_ALLOWED_PREFIXES = [
    os.path.realpath(os.path.expanduser("~")),
    os.path.realpath(os.environ.get("TMPDIR", "/tmp")),
]


def _is_allowed_path(filepath: str) -> bool:
    """Ellenorzi, hogy az utvonal az engedelyezett konyvtarakon belul van-e."""
    try:
        real = os.path.realpath(filepath)
        return any(real.startswith(prefix + os.sep) for prefix in _ALLOWED_PREFIXES)
    except (ValueError, OSError):
        return False

# Add parent to path for relative imports
sys.path.insert(0, str(Path(__file__).parent))

from birefnet import remove_background, check_available, BiRefNetError
from border_crop import detect_and_crop_border
from compositor import Compositor, darken_background
from constants import PRESET_BACKGROUNDS, DEFAULT_PRESET
from processing import EdgeProcessor, shrink_mask, feather_edges, smooth_edges

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

_srgb_profile = ImageCms.createProfile("sRGB")


def ensure_srgb(image: Image.Image, icc_profile: bytes = None):
    """Convert image to sRGB if it has a different color profile."""
    if not icc_profile:
        return image, icc_profile
    try:
        src_profile = ImageCms.ImageCmsProfile(io.BytesIO(icc_profile))
        src_name = ImageCms.getProfileDescription(src_profile)
        if "srgb" in src_name.lower():
            return image, icc_profile
        logger.info(f"ICC konverzió: {src_name} -> sRGB")
        dst_profile = ImageCms.ImageCmsProfile(_srgb_profile)
        converted = ImageCms.profileToProfile(image, src_profile, dst_profile, outputMode="RGB")
        return converted, dst_profile.tobytes()
    except Exception as e:
        logger.warning(f"ICC konverzió sikertelen: {e}")
        return image, icc_profile


def resolve_background(settings: dict):
    """Resolve background from settings to a compositor-compatible value."""
    bg_type = settings.get("background_type", "preset")

    if bg_type == "preset":
        preset = settings.get("preset_name", DEFAULT_PRESET)
        if preset in PRESET_BACKGROUNDS:
            return PRESET_BACKGROUNDS[preset]
        return PRESET_BACKGROUNDS[DEFAULT_PRESET]

    elif bg_type == "color":
        r = int(settings.get("color_r", 0) or 0)
        g = int(settings.get("color_g", 0) or 0)
        b = int(settings.get("color_b", 0) or 0)
        return (max(0, min(255, r)), max(0, min(255, g)), max(0, min(255, b)))

    elif bg_type == "image":
        bg_path = settings.get("background_image_path")
        if bg_path and _is_allowed_path(bg_path) and Path(bg_path).exists():
            return Path(bg_path)
        logger.warning("Háttérkép nem található vagy nem engedélyezett, preset használata")
        return PRESET_BACKGROUNDS[DEFAULT_PRESET]

    elif bg_type == "gradient":
        sr = int(settings.get("gradient_start_r", 0) or 0)
        sg = int(settings.get("gradient_start_g", 0) or 0)
        sb = int(settings.get("gradient_start_b", 0) or 0)
        er = int(settings.get("gradient_end_r", 0) or 0)
        eg = int(settings.get("gradient_end_g", 0) or 0)
        eb = int(settings.get("gradient_end_b", 0) or 0)
        direction = settings.get("gradient_direction", "vertical")
        return {"type": "gradient", "start": (sr, sg, sb), "end": (er, eg, eb), "direction": direction}

    return PRESET_BACKGROUNDS[DEFAULT_PRESET]


def create_gradient_image(size, start_color, end_color, direction="vertical"):
    """Create a gradient image."""
    w, h = size
    arr = np.zeros((h, w, 3), dtype=np.float32)

    if direction == "radial":
        cx, cy = w / 2, h / 2
        max_dist = ((cx ** 2) + (cy ** 2)) ** 0.5
        y_coords, x_coords = np.mgrid[0:h, 0:w]
        distances = np.sqrt((x_coords - cx) ** 2 + (y_coords - cy) ** 2) / max_dist
        distances = np.clip(distances, 0, 1)
        for i in range(3):
            arr[:, :, i] = start_color[i] * (1 - distances) + end_color[i] * distances
    elif direction == "horizontal":
        for i in range(3):
            arr[:, :, i] = np.linspace(start_color[i], end_color[i], w)[np.newaxis, :]
    else:  # vertical
        for i in range(3):
            arr[:, :, i] = np.linspace(start_color[i], end_color[i], h)[:, np.newaxis]

    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), mode="RGB")


def process_single(input_path: str, output_path: str, settings: dict) -> dict:
    """Process a single portrait image."""
    start_time = time.time()

    # Path validacio (defense-in-depth)
    if not _is_allowed_path(input_path):
        return {"success": False, "input": input_path, "error": "Nem engedélyezett bemeneti útvonal", "processing_time": 0}
    if not _is_allowed_path(output_path):
        return {"success": False, "input": input_path, "error": "Nem engedélyezett kimeneti útvonal", "processing_time": 0}

    input_path = Path(input_path)
    output_path = Path(output_path)

    try:
        # Load and prepare image
        original = Image.open(input_path)
        icc_profile = original.info.get("icc_profile")
        original = detect_and_crop_border(original)
        original, icc_profile = ensure_srgb(original, icc_profile)

        # Remove background (croppolt kepet adjuk at, nem az eredeti fajlt)
        logger.info(f"[1/3] Háttér eltávolítás: {input_path.name}")
        foreground, alpha_mask = remove_background(original)

        if foreground.mode != "RGBA":
            foreground = foreground.convert("RGBA")

        mode = settings.get("mode", "replace")

        if mode == "darken":
            # Darken mode: light edge processing then darken
            logger.info("[2/3] Háttér sötétítés")
            processed_alpha = alpha_mask
            if settings.get("edge_inset", 0) > 0:
                processed_alpha = shrink_mask(processed_alpha, settings["edge_inset"])
            if settings.get("edge_smoothing", 0) > 0:
                processed_alpha = smooth_edges(processed_alpha, settings["edge_smoothing"])
            if settings.get("feather_radius", 0) > 0:
                processed_alpha = feather_edges(processed_alpha, settings["feather_radius"])

            result = darken_background(
                original, processed_alpha,
                darken_amount=settings.get("darken_amount", 0.7),
                target_brightness=settings.get("target_brightness", 35),
            )
        else:
            # Replace mode: full processing
            logger.info("[2/3] Él feldolgozás")
            edge_processor = EdgeProcessor(
                edge_inset=settings.get("edge_inset", 2),
                feather_radius=settings.get("feather_radius", 3),
                decontaminate=settings.get("decontaminate", True),
                decontaminate_strength=settings.get("decontaminate_strength", 0.8),
                hair_refinement=settings.get("hair_refinement", True),
                hair_refinement_strength=settings.get("hair_refinement_strength", 0.4),
                edge_smoothing=settings.get("edge_smoothing", 2),
            )
            processed_fg, processed_alpha = edge_processor.process(foreground, alpha_mask, original_image=original)

            # Resolve background
            background = resolve_background(settings)
            if isinstance(background, dict) and background.get("type") == "gradient":
                gradient_img = create_gradient_image(
                    original.size, background["start"], background["end"], background["direction"]
                )
                compositor = Compositor(gradient_img)
            else:
                compositor = Compositor(background)

            logger.info("[3/3] Kompozitálás")
            if settings.get("add_shadow", False):
                result = compositor.composite_with_shadow(
                    processed_fg, processed_alpha,
                    shadow_opacity=settings.get("shadow_opacity", 0.3),
                )
            else:
                result = compositor.composite(processed_fg, processed_alpha)

        # Save
        output_path.parent.mkdir(parents=True, exist_ok=True)
        save_kwargs = {}
        if icc_profile:
            save_kwargs["icc_profile"] = icc_profile

        quality = max(50, min(100, settings.get("output_quality", 95)))
        result.save(output_path, "JPEG", quality=quality, **save_kwargs)

        elapsed = time.time() - start_time
        logger.info(f"Kész: {input_path.name} ({elapsed:.2f}s)")

        return {
            "success": True,
            "input": str(input_path),
            "output": str(output_path),
            "processing_time": round(elapsed, 2),
        }

    except BiRefNetError as e:
        return {"success": False, "input": str(input_path), "error": f"AI hiba: {e}", "processing_time": round(time.time() - start_time, 2)}
    except Exception as e:
        return {"success": False, "input": str(input_path), "error": str(e), "processing_time": round(time.time() - start_time, 2)}


def main():
    parser = argparse.ArgumentParser(description="Portrait background replacement")
    parser.add_argument("--check", action="store_true", help="Check if InSPyReNet is available")
    parser.add_argument("--input", help="Input image path")
    parser.add_argument("--output", help="Output image path")
    parser.add_argument("--settings-json", help="Path to settings JSON file")
    parser.add_argument("--batch-json", help="Path to batch JSON file (array of {input, output})")

    args = parser.parse_args()

    if args.check:
        available = check_available()
        print(json.dumps({"available": available}))
        sys.exit(0 if available else 1)

    # Load settings
    settings = {}
    if args.settings_json:
        settings_path = Path(args.settings_json)
        if settings_path.exists():
            settings = json.loads(settings_path.read_text("utf-8"))

    # Batch mode
    if args.batch_json:
        batch_path = Path(args.batch_json)
        if not batch_path.exists():
            print(json.dumps({"success": False, "error": "Batch JSON nem található"}))
            sys.exit(1)
        items = json.loads(batch_path.read_text("utf-8"))
        if len(items) > MAX_BATCH_SIZE:
            print(json.dumps({"success": False, "error": f"Túl sok elem (max {MAX_BATCH_SIZE})"}))
            sys.exit(1)
        results = []
        for item in items:
            result = process_single(item["input"], item["output"], settings)
            results.append(result)
            # Flush progress per item
            print(json.dumps({"progress": len(results), "total": len(items), "current": result}), flush=True)
        successful = sum(1 for r in results if r["success"])
        print(json.dumps({"success": True, "results": results, "total": len(results), "successful": successful}))
        sys.exit(0)

    # Single mode
    if not args.input or not args.output:
        parser.error("--input és --output szükséges (vagy --check / --batch-json)")

    result = process_single(args.input, args.output, settings)
    print(json.dumps(result))
    sys.exit(0 if result["success"] else 1)


if __name__ == "__main__":
    main()
