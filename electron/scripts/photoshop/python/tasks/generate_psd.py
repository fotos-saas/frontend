#!/usr/bin/env python3
"""
PSD generalo script - ures PSD fajl letrehozasa megadott meretben.

Hasznalat:
  python generate_psd.py --width-cm 120 --height-cm 80 --dpi 200 --mode RGB --output /path/to/file.psd
"""

import argparse
import struct
import sys
from pathlib import Path

from psd_tools import PSDImage
from psd_tools.constants import Resource


def cm_to_px(cm: float, dpi: int) -> int:
    """Centimeterbol pixel szamitas adott DPI-vel."""
    return round(cm * dpi / 2.54)


def set_resolution(psd: PSDImage, dpi: int) -> None:
    """DPI beallitas a PSD image resource-ban (ResolutionInfo)."""
    # ResolutionInfo formatuma (Adobe PSD specifikacioja):
    # - hRes: 4 byte fixed-point 16.16 (horizontal DPI)
    # - hResUnit: 2 byte (1 = pixels/inch)
    # - widthUnit: 2 byte (1 = inches, 2 = cm)
    # - vRes: 4 byte fixed-point 16.16 (vertical DPI)
    # - vResUnit: 2 byte (1 = pixels/inch)
    # - heightUnit: 2 byte (1 = inches, 2 = cm)
    fixed_dpi = dpi * 65536  # 16.16 fixed-point
    resolution_data = struct.pack(
        '>I H H I H H',
        fixed_dpi,  # hRes
        1,          # hResUnit (pixels/inch)
        2,          # widthUnit (cm)
        fixed_dpi,  # vRes
        1,          # vResUnit (pixels/inch)
        2,          # heightUnit (cm)
    )
    psd.image_resources[Resource.RESOLUTION_INFO] = resolution_data


def main() -> None:
    parser = argparse.ArgumentParser(description='Ures PSD fajl generalasa')
    parser.add_argument('--width-cm', type=float, required=True, help='Szelesseg cm-ben')
    parser.add_argument('--height-cm', type=float, required=True, help='Magassag cm-ben')
    parser.add_argument('--dpi', type=int, default=200, help='Felbontas (alapertelmezett: 200)')
    parser.add_argument('--mode', type=str, default='RGB', help='Szinmod (alapertelmezett: RGB)')
    parser.add_argument('--output', type=str, required=True, help='Kimeneti fajl eleresi ut')
    args = parser.parse_args()

    width_px = cm_to_px(args.width_cm, args.dpi)
    height_px = cm_to_px(args.height_cm, args.dpi)

    if width_px <= 0 or height_px <= 0:
        print(f'Hibas meret: {width_px}x{height_px}px', file=sys.stderr)
        sys.exit(1)

    if width_px > 300000 or height_px > 300000:
        print(f'Tul nagy meret: {width_px}x{height_px}px (max 300000)', file=sys.stderr)
        sys.exit(1)

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    psd = PSDImage.new(mode=args.mode, size=(width_px, height_px))
    set_resolution(psd, args.dpi)
    psd.save(str(output_path))

    print(f'PSD letrehozva: {output_path} ({width_px}x{height_px}px, {args.dpi} DPI, {args.mode})')


if __name__ == '__main__':
    main()
