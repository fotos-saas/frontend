"""Edge processing: shrink, feather, decontaminate, hair refinement, smooth."""

import logging
from __future__ import annotations
from typing import Optional

import cv2
import numpy as np
from PIL import Image

from constants import DEFAULT_DECONTAMINATE_STRENGTH, DEFAULT_FEATHER_RADIUS

logger = logging.getLogger(__name__)


def detect_background_color(original: Image.Image, alpha_mask: Image.Image) -> tuple[int, int, int]:
    img_array = np.array(original.convert("RGB"))
    mask_array = np.array(alpha_mask)
    bg_mask = mask_array < 30
    if not np.any(bg_mask):
        return (128, 128, 128)
    bg_pixels = img_array[bg_mask]
    if len(bg_pixels) > 1000:
        indices = np.random.choice(len(bg_pixels), 1000, replace=False)
        bg_pixels = bg_pixels[indices]
    median_color = np.median(bg_pixels, axis=0).astype(int)
    return (int(median_color[0]), int(median_color[1]), int(median_color[2]))


def shrink_mask(alpha_mask: Image.Image, pixels: int = 2) -> Image.Image:
    if pixels <= 0:
        return alpha_mask
    mask_array = np.array(alpha_mask).astype(np.uint8)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (pixels * 2 + 1, pixels * 2 + 1))
    eroded = cv2.erode(mask_array, kernel, iterations=1)
    return Image.fromarray(eroded, mode="L")


def feather_edges(alpha_mask: Image.Image, radius: int = DEFAULT_FEATHER_RADIUS) -> Image.Image:
    if radius <= 0:
        return alpha_mask
    mask_array = np.array(alpha_mask).astype(np.float32)
    blur_size = radius * 2 + 1
    blurred = cv2.GaussianBlur(mask_array, (blur_size, blur_size), 0)
    result = np.minimum(mask_array, blurred)
    return Image.fromarray(result.astype(np.uint8), mode="L")


def refine_hair_edges(foreground: Image.Image, alpha_mask: Image.Image, strength: float = 0.5) -> tuple[Image.Image, Image.Image]:
    mask_array = np.array(alpha_mask).astype(np.float32)
    original_mask = mask_array.copy()
    mask_uint8 = mask_array.astype(np.uint8)
    smoothed = cv2.bilateralFilter(mask_uint8, 7, 50, 50)
    mask_array = smoothed.astype(np.float32)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    eroded = cv2.erode(mask_array, kernel, iterations=1)
    edge_region = ((mask_array > 10) & (eroded < 245)).astype(np.float32)
    alpha_weight = 1.0 - np.abs(mask_array / 255.0 - 0.5) * 2
    edge_region = edge_region * alpha_weight
    noise = np.random.rand(*mask_array.shape).astype(np.float32)
    kernel_v = np.array([[0.1], [0.2], [0.4], [0.2], [0.1]], dtype=np.float32)
    noise = cv2.filter2D(noise, -1, kernel_v)
    noise_effect = (noise - 0.5) * strength * 15
    noise_effect = np.minimum(noise_effect, 0)
    refined_mask = mask_array + (noise_effect * edge_region)
    refined_mask = np.clip(refined_mask, 0, 255)
    refined_mask = np.minimum(refined_mask, original_mask)
    refined_mask = refined_mask.astype(np.uint8)
    fg_array = np.array(foreground)
    fg_array[:, :, 3] = refined_mask
    return Image.fromarray(fg_array, mode="RGBA"), Image.fromarray(refined_mask, mode="L")


def smooth_edges(alpha_mask: Image.Image, smoothness: int = 2) -> Image.Image:
    mask_array = np.array(alpha_mask).astype(np.float32)
    original = mask_array.copy()
    mask_uint8 = mask_array.astype(np.uint8)
    for _ in range(smoothness):
        mask_uint8 = cv2.bilateralFilter(mask_uint8, 5, 50, 50)
    result = np.minimum(original, mask_uint8.astype(np.float32))
    return Image.fromarray(result.astype(np.uint8), mode="L")


def color_decontaminate(foreground: Image.Image, alpha_mask: Image.Image, bg_color: tuple[int, int, int], strength: float = DEFAULT_DECONTAMINATE_STRENGTH) -> Image.Image:
    fg_array = np.array(foreground).astype(np.float32)
    alpha_array = np.array(alpha_mask).astype(np.float32) / 255.0
    r, g, b, a = fg_array[:, :, 0], fg_array[:, :, 1], fg_array[:, :, 2], fg_array[:, :, 3]
    edge_mask = (alpha_array > 0.05) & (alpha_array < 0.95)
    bg_r, bg_g, bg_b = bg_color
    for channel, bg_val in [(r, bg_r), (g, bg_g), (b, bg_b)]:
        safe_alpha = np.maximum(alpha_array, 0.01)
        decontaminated = (channel - (1 - alpha_array) * bg_val * strength) / safe_alpha
        channel[edge_mask] = np.clip(decontaminated[edge_mask], 0, 255)
    result = np.stack([r, g, b, a], axis=2).astype(np.uint8)
    return Image.fromarray(result, mode="RGBA")


class EdgeProcessor:
    """Complete edge processing pipeline."""

    def __init__(self, edge_inset=2, feather_radius=DEFAULT_FEATHER_RADIUS,
                 decontaminate=True, decontaminate_strength=DEFAULT_DECONTAMINATE_STRENGTH,
                 hair_refinement=True, hair_refinement_strength=0.4, edge_smoothing=2):
        self.edge_inset = edge_inset
        self.feather_radius = feather_radius
        self.decontaminate = decontaminate
        self.decontaminate_strength = decontaminate_strength
        self.hair_refinement = hair_refinement
        self.hair_refinement_strength = hair_refinement_strength
        self.edge_smoothing = edge_smoothing

    def process(self, foreground: Image.Image, alpha_mask: Image.Image,
                original_image: Optional[Image.Image] = None) -> tuple[Image.Image, Image.Image]:
        if self.edge_inset > 0:
            alpha_mask = shrink_mask(alpha_mask, self.edge_inset)
        if self.edge_smoothing > 0:
            alpha_mask = smooth_edges(alpha_mask, self.edge_smoothing)
        if self.decontaminate:
            bg_color = detect_background_color(original_image, alpha_mask) if original_image else (128, 128, 128)
            foreground = color_decontaminate(foreground, alpha_mask, bg_color, self.decontaminate_strength)
        alpha_mask = feather_edges(alpha_mask, self.feather_radius)
        if self.hair_refinement:
            foreground, alpha_mask = refine_hair_edges(foreground, alpha_mask, self.hair_refinement_strength)
        fg_array = np.array(foreground)
        fg_array[:, :, 3] = np.array(alpha_mask)
        foreground = Image.fromarray(fg_array, mode="RGBA")
        return foreground, alpha_mask
