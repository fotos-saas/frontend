#!/usr/bin/env python3
"""
PSD generalo script - ures PSD fajl letrehozasa tablohoz tartozo
mappastrukturával (group/layer).

Hasznalat:
  python generate_psd.py --width-cm 120 --height-cm 80 --dpi 200 --mode RGB --output /path/to/file.psd
  python generate_psd.py --width-cm 120 --height-cm 80 --dpi 200 --mode RGB --output /path/to/file.psd --persons-json /path/to/persons.json

Struktura:
  Subtitles/
  Names/
    Students/
      kiss-janos---42   (1x1 px placeholder)
      ...
    Teachers/
      szabo-anna---101  (1x1 px placeholder)
      ...
  Positions/
    Students/
    Teachers/
  Images/
    Students/
    Teachers/
  Backgrounds/
"""

import argparse
import json
import re
import struct
import sys
from pathlib import Path

from PIL import Image
from psd_tools import PSDImage
from psd_tools.constants import Resource
from psd_tools.psd.image_resources import ImageResource


# Magyar ekezet-terkep az ASCII-re
ACCENT_MAP = {
    'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ö': 'o', 'ő': 'o',
    'ú': 'u', 'ü': 'u', 'ű': 'u',
    'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ö': 'O', 'Ő': 'O',
    'Ú': 'U', 'Ü': 'U', 'Ű': 'U',
}


def cm_to_px(cm: float, dpi: int) -> int:
    """Centimeterbol pixel szamitas adott DPI-vel."""
    return round(cm * dpi / 2.54)


def sanitize_name(name: str, person_id: int) -> str:
    """
    Nev + ID slug generalas: 'Kiss János' + 42 => 'kiss-janos---42'
    Ekezetek eltavolitasa, kisbetusites, nem-alfanumerikus => kotojel.
    """
    slug = name
    for accent, replacement in ACCENT_MAP.items():
        slug = slug.replace(accent, replacement)
    slug = slug.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = slug.strip('-')
    return f'{slug}---{person_id}'


def create_placeholder_layer(psd: PSDImage, layer_name: str):
    """1x1 px atlatszo PixelLayer letrehozasa adott nevvel."""
    img = Image.new('RGBA', (1, 1), (0, 0, 0, 0))
    layer = psd.create_pixel_layer(
        name=layer_name,
        image=img,
    )
    return layer


def create_sub_pair(psd: PSDImage, persons=None):
    """
    Students + Teachers almappa par letrehozasa.
    Ha vannak szemelyek, mindegyikhez placeholder layer-t tesz.
    """
    student_layers = []
    teacher_layers = []

    if persons:
        for p in persons:
            slug = sanitize_name(p['name'], p['id'])
            layer = create_placeholder_layer(psd, slug)
            if p['type'] == 'teacher':
                teacher_layers.append(layer)
            else:
                student_layers.append(layer)

    students = psd.create_group(name='Students', layer_list=student_layers or None)
    teachers = psd.create_group(name='Teachers', layer_list=teacher_layers or None)
    return [students, teachers]


def main() -> None:
    parser = argparse.ArgumentParser(description='Ures PSD fajl generalasa tablohoz')
    parser.add_argument('--width-cm', type=float, required=True, help='Szelesseg cm-ben')
    parser.add_argument('--height-cm', type=float, required=True, help='Magassag cm-ben')
    parser.add_argument('--dpi', type=int, default=200, help='Felbontas (alapertelmezett: 200)')
    parser.add_argument('--mode', type=str, default='RGB', help='Szinmod (alapertelmezett: RGB)')
    parser.add_argument('--output', type=str, required=True, help='Kimeneti fajl eleresi ut')
    parser.add_argument('--persons-json', type=str, default=None,
                        help='JSON fajl a szemelyek listajával')
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

    # Szemelyek betoltese JSON-bol (ha megadtak)
    persons = None
    if args.persons_json:
        json_path = Path(args.persons_json)
        if not json_path.exists():
            print(f'Szemelyek JSON fajl nem talalhato: {json_path}', file=sys.stderr)
            sys.exit(1)
        with open(json_path, 'r', encoding='utf-8') as f:
            persons = json.load(f)
        print(f'Szemelyek betoltve: {len(persons)} fo')

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
    # Images/ (Students + Teachers almappakkal + szemelyek layer-jeivel)
    images = psd.create_group(layer_list=create_sub_pair(psd, persons), name='Images')

    # Positions/ (Students + Teachers almappakkal + szemelyek layer-jeivel)
    positions = psd.create_group(layer_list=create_sub_pair(psd, persons), name='Positions')

    # Names/ (Students + Teachers almappakkal + szemelyek layer-jeivel)
    names = psd.create_group(layer_list=create_sub_pair(psd, persons), name='Names')

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

    person_info = f', {len(persons)} szemely' if persons else ''
    print(f'PSD letrehozva: {output_path} ({width_px}x{height_px}px, {args.dpi} DPI, {mode}{person_info})')


if __name__ == '__main__':
    main()
