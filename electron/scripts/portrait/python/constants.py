"""Portrait processing constants."""

DEFAULT_FEATHER_RADIUS = 3
DEFAULT_DECONTAMINATE = True
DEFAULT_DECONTAMINATE_STRENGTH = 0.8

SUPPORTED_IMAGE_FORMATS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff"}

PRESET_BACKGROUNDS = {
    "dark_gray": (26, 26, 26),
    "charcoal": (40, 40, 40),
    "navy": (20, 30, 50),
    "dark_blue": (15, 25, 45),
    "black": (0, 0, 0),
    "white": (255, 255, 255),
    "light_gray": (200, 200, 200),
}
