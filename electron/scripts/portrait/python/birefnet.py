"""Local AI background removal using InSPyReNet (transparent-background).

First run downloads the model (~200MB). Runs on MPS (Apple Silicon),
CUDA (NVIDIA), or CPU automatically.
"""

import io
import logging
from pathlib import Path
from typing import Tuple, Union

from PIL import Image

logger = logging.getLogger(__name__)

_remover = None


class BiRefNetError(Exception):
    pass


def _load_remover(mode: str = "base"):
    global _remover
    if _remover is not None:
        return _remover

    try:
        from transparent_background import Remover
    except ImportError:
        raise BiRefNetError(
            "transparent-background csomag szükséges.\n"
            "Telepítés: pip install transparent-background"
        )

    logger.info(f"InSPyReNet modell betöltése (mode={mode})...")
    _remover = Remover(mode=mode)
    logger.info("InSPyReNet modell betöltve")
    return _remover


def remove_background(image_or_path: Union[str, Path, Image.Image]) -> Tuple[Image.Image, Image.Image]:
    """Remove background from image file or PIL Image object.

    Args:
        image_or_path: File path (str/Path) or PIL Image object.

    Returns: (foreground_rgba, alpha_mask)
    """
    if isinstance(image_or_path, Image.Image):
        image = image_or_path
    else:
        image_path = Path(image_or_path)
        if not image_path.exists():
            raise FileNotFoundError(f"Kép nem található: {image_path}")
        image = Image.open(image_path)

    if image.mode not in ("RGB", "RGBA"):
        image = image.convert("RGB")

    remover = _load_remover()
    result = remover.process(image, type='rgba')

    if result.mode != "RGBA":
        result = result.convert("RGBA")

    alpha_mask = result.split()[3]
    return result, alpha_mask


def check_available() -> bool:
    """Check if InSPyReNet model can be loaded."""
    try:
        _load_remover()
        return True
    except Exception:
        return False
