"""White border detection and automatic cropping for portrait images."""

import logging
from typing import Tuple

import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

_MIN_BORDER_PX = 8
_MAX_BORDER_RATIO = 0.25
_MIN_CONTENT_RATIO = 0.5
_SAFETY_MARGIN = 2
_INNER_BORDER_MAX = 15
_WHITE_THRESHOLD = 240
_WHITE_UNIFORMITY = 0.92


def _detect_white_border(center_strip, max_border, threshold=_WHITE_THRESHOLD, uniformity=_WHITE_UNIFORMITY):
    scan_limit = min(len(center_strip), max_border)
    border = 0
    for i in range(scan_limit):
        row = center_strip[i]
        is_white = np.all(row >= threshold, axis=-1)
        if np.mean(is_white) < uniformity:
            break
        border = i + 1
    return border


def _detect_inner_border(center_strip, start, max_extra=_INNER_BORDER_MAX):
    end = min(start + max_extra, len(center_strip))
    extra = 0
    for i in range(start, end):
        row = center_strip[i]
        std = np.std(row.astype(np.float32))
        brightness = row.mean()
        if brightness > 200 and std < 10:
            extra = i - start + 1
            continue
        if brightness < 80 and std < 10:
            extra = i - start + 1
            continue
        if std < 5 and 80 <= brightness <= 200:
            extra = i - start + 1
            continue
        break
    return extra


def _detect_border_one_side(full_pixels, cross_size, max_border):
    margin = int(cross_size * 0.2)
    center = full_pixels[:, margin:cross_size - margin]
    white = _detect_white_border(center, max_border)
    if white == 0:
        return 0
    inner = _detect_inner_border(center, white)
    return min(white + inner, max_border)


def detect_and_crop_border(image: Image.Image) -> Image.Image:
    """Detect and crop white border from a portrait image."""
    rgb_image = image.convert("RGB") if image.mode != "RGB" else image
    arr = np.array(rgb_image, dtype=np.uint8)
    h, w = arr.shape[:2]
    max_h = int(h * _MAX_BORDER_RATIO)
    max_w = int(w * _MAX_BORDER_RATIO)

    top = _detect_border_one_side(arr, w, max_h)
    bottom = _detect_border_one_side(arr[::-1], w, max_h)
    left = _detect_border_one_side(arr.transpose(1, 0, 2), h, max_w)
    right = _detect_border_one_side(arr[:, ::-1].transpose(1, 0, 2), h, max_w)

    top = top if top >= _MIN_BORDER_PX else 0
    bottom = bottom if bottom >= _MIN_BORDER_PX else 0
    left = left if left >= _MIN_BORDER_PX else 0
    right = right if right >= _MIN_BORDER_PX else 0

    if top == 0 and bottom == 0 and left == 0 and right == 0:
        return image

    uniform = max(top, bottom, left, right)
    top = bottom = left = right = max(0, uniform - _SAFETY_MARGIN)

    x1, y1 = left, top
    x2, y2 = w - right, h - bottom
    content_w, content_h = x2 - x1, y2 - y1

    if content_w < w * _MIN_CONTENT_RATIO or content_h < h * _MIN_CONTENT_RATIO:
        return image

    logger.info(f"Border crop: {w}x{h} -> {content_w}x{content_h}")
    cropped = image.crop((x1, y1, x2, y2))
    icc = image.info.get("icc_profile")
    if icc:
        cropped.info["icc_profile"] = icc
    return cropped
