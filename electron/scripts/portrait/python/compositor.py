"""Image compositor: alpha blending foreground onto backgrounds."""

import logging
from pathlib import Path
from typing import Optional, Tuple, Union

import cv2
import numpy as np
from PIL import Image, ImageFilter

from constants import PRESET_BACKGROUNDS

logger = logging.getLogger(__name__)


class Compositor:
    """Composites foreground images onto backgrounds using alpha blending."""

    def __init__(self, background: Union[str, Path, Image.Image, Tuple[int, int, int]]):
        if isinstance(background, str) and background in PRESET_BACKGROUNDS:
            self.background_source = PRESET_BACKGROUNDS[background]
        else:
            self.background_source = background
        self._bg_cache = {}

    def _load_background(self, size: Tuple[int, int]) -> Image.Image:
        if size in self._bg_cache:
            return self._bg_cache[size].copy()

        if isinstance(self.background_source, tuple):
            bg = Image.new("RGB", size, self.background_source)
        elif isinstance(self.background_source, Image.Image):
            bg = self._resize_cover(self.background_source, size)
        else:
            path = Path(self.background_source)
            if not path.exists():
                raise FileNotFoundError(f"Háttérkép nem található: {path}")
            bg = self._resize_cover(Image.open(path), size)

        if bg.mode != "RGB":
            bg = bg.convert("RGB")
        self._bg_cache[size] = bg.copy()
        return bg

    @staticmethod
    def _resize_cover(bg: Image.Image, target: Tuple[int, int]) -> Image.Image:
        tw, th = target
        bw, bh = bg.size
        scale = max(tw / bw, th / bh)
        new_size = (int(bw * scale), int(bh * scale))
        resized = bg.resize(new_size, Image.Resampling.LANCZOS)
        left = (resized.width - tw) // 2
        top = (resized.height - th) // 2
        return resized.crop((left, top, left + tw, top + th))

    def composite(self, foreground: Image.Image, alpha_mask: Optional[Image.Image] = None) -> Image.Image:
        if foreground.mode != "RGBA":
            foreground = foreground.convert("RGBA")
        if alpha_mask is None:
            alpha_mask = foreground.split()[3]
        bg = self._load_background(foreground.size)
        fg_arr = np.array(foreground).astype(np.float32)
        bg_arr = np.array(bg).astype(np.float32)
        alpha_arr = np.array(alpha_mask).astype(np.float32) / 255.0
        alpha_3ch = np.stack([alpha_arr] * 3, axis=2)
        result = fg_arr[:, :, :3] * alpha_3ch + bg_arr * (1 - alpha_3ch)
        return Image.fromarray(np.clip(result, 0, 255).astype(np.uint8), mode="RGB")

    def composite_with_shadow(self, foreground: Image.Image, alpha_mask: Optional[Image.Image] = None,
                               shadow_offset=(5, 5), shadow_blur=10, shadow_opacity=0.3) -> Image.Image:
        if foreground.mode != "RGBA":
            foreground = foreground.convert("RGBA")
        if alpha_mask is None:
            alpha_mask = foreground.split()[3]
        shadow = alpha_mask.copy()
        if shadow_blur > 0:
            shadow = shadow.filter(ImageFilter.GaussianBlur(shadow_blur))
        shadow_arr = np.array(shadow).astype(np.float32) * shadow_opacity
        shadow = Image.fromarray(shadow_arr.astype(np.uint8), mode="L")
        bg = self._load_background(foreground.size)
        shadow_img = Image.new("RGBA", foreground.size, (0, 0, 0, 255))
        shadow_img.putalpha(shadow)
        offset_shadow = Image.new("RGBA", foreground.size, (0, 0, 0, 0))
        offset_shadow.paste(shadow_img, shadow_offset)
        result = bg.convert("RGBA")
        result = Image.alpha_composite(result, offset_shadow)
        result = Image.alpha_composite(result, foreground)
        return result.convert("RGB")


def darken_background(original: Image.Image, alpha_mask: Image.Image,
                       darken_amount=0.6, target_brightness=40) -> Image.Image:
    img_arr = np.array(original.convert("RGB")).astype(np.float32)
    mask_arr = np.array(alpha_mask).astype(np.float32) / 255.0
    mask_smooth = cv2.GaussianBlur(mask_arr, (21, 21), 0)
    bg_mask = 1.0 - mask_smooth
    gray = np.mean(img_arr, axis=2)
    darkening = np.clip(target_brightness / (gray + 1), 0.1, 1.0)
    for i in range(3):
        darkened = img_arr[:, :, i] * darkening
        strength = bg_mask * darken_amount
        img_arr[:, :, i] = img_arr[:, :, i] * (1 - strength) + darkened * strength
    return Image.fromarray(np.clip(img_arr, 0, 255).astype(np.uint8), mode="RGB")
