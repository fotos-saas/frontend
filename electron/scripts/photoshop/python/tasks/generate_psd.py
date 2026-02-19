#!/usr/bin/env python3
"""
PSD generalo script - ures PSD fajl letrehozasa tablohoz tartozo
mappastrukturával (group/layer).

Hasznalat:
  python generate_psd.py --width-cm 120 --height-cm 80 --dpi 200 --mode RGB --output /path/to/file.psd

Struktura:
  Subtitles/
  Names/
    Students/
    Teachers/
  Positions/
    Students/
    Teachers/
  Images/
    Students/
    Teachers/
  Background
"""

import argparse
import struct
import sys
from pathlib import Path

from psd_tools import PSDImage
from psd_tools.constants import Resource
from psd_tools.psd.image_resources import ImageResource


def cm_to_px(cm: float, dpi: int) -> int:
    """Centimeterbol pixel szamitas adott DPI-vel."""
    return round(cm * dpi / 2.54)


def create_sub_pair(psd: PSDImage):
    """Students + Teachers almappa par letrehozasa."""
    students = psd.create_group(name='Students')
    teachers = psd.create_group(name='Teachers')
    return [students, teachers]


def main() -> None:
    parser = argparse.ArgumentParser(description='Ures PSD fajl generalasa tablohoz')
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

    mode = args.mode.upper()
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # --- PSD letrehozasa ---
    psd = PSDImage.new(mode=mode, size=(width_px, height_px))

    # DPI beallitas (ResolutionInfo resource)
    fixed_dpi = args.dpi * 65536  # 16.16 fixed-point
    res_data = struct.pack(
        '>I H H I H H',
        fixed_dpi, 1, 2,   # hRes, hResUnit(px/inch), widthUnit(cm)
        fixed_dpi, 1, 2,   # vRes, vResUnit(px/inch), heightUnit(cm)
    )
    psd.image_resources[Resource.RESOLUTION_INFO] = ImageResource(
        key=Resource.RESOLUTION_INFO.value,
        data=res_data,
    )

    # --- Mappastruktura ---
    # Images/ (Students + Teachers almappakkal)
    images = psd.create_group(layer_list=create_sub_pair(psd), name='Images')

    # Positions/ (Students + Teachers almappakkal)
    positions = psd.create_group(layer_list=create_sub_pair(psd), name='Positions')

    # Names/ (Students + Teachers almappakkal)
    names = psd.create_group(layer_list=create_sub_pair(psd), name='Names')

    # Subtitles/ (almappak nelkul)
    subtitles = psd.create_group(name='Subtitles')

    # Backgrounds/ (legalul)
    backgrounds = psd.create_group(name='Backgrounds')

    # Csoportok hozzaadasa (Photoshop-ban alulrol felfele jelenik meg)
    psd.append(backgrounds)
    psd.append(images)
    psd.append(positions)
    psd.append(names)
    psd.append(subtitles)

    # --- Mentes ---
    psd.save(str(output_path))

    print(f'PSD letrehozva: {output_path} ({width_px}x{height_px}px, {args.dpi} DPI, {mode})')


if __name__ == '__main__':
    main()
