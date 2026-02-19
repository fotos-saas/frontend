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
      kiss-janos---42   (TypeLayer, Arial 25pt, szoveg: "Kiss Janos")
      ...
    Teachers/
      szabo-anna---101  (TypeLayer, Arial 25pt, szoveg: "Szabo Anna")
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
import io
import json
import re
import struct
import sys
from pathlib import Path

from psd_tools import PSDImage
from psd_tools.api.layers import TypeLayer
from psd_tools.constants import (
    BlendMode, ChannelID, Compression, Resource, Tag,
)
from psd_tools.psd.descriptor import (
    DescriptorBlock, RawData, String as DescString,
)
from psd_tools.psd.engine_data import (
    Bool, Dict as EDict, EngineData, Float, Integer,
    List as EList, Property, String,
)
from psd_tools.psd.image_resources import ImageResource
from psd_tools.psd.layer_and_mask import (
    ChannelData, ChannelDataList, ChannelInfo, LayerRecord,
)
from psd_tools.psd.tagged_blocks import (
    TaggedBlock, TaggedBlocks, TypeToolObjectSetting,
)


# Magyar ekezet-terkep az ASCII-re
ACCENT_MAP = {
    'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ö': 'o', 'ő': 'o',
    'ú': 'u', 'ü': 'u', 'ű': 'u',
    'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ö': 'O', 'Ő': 'O',
    'Ú': 'U', 'Ü': 'U', 'Ű': 'U',
}


# EngineData helper fuggvenyek
def _prop(name):
    return Property.frombytes(('/' + name).encode('ascii'))

def _estr(value):
    return String.frombytes(value.encode('utf-16-be'))

def _efloat(value):
    return Float(value)

def _eint(value):
    return Integer(value)


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


def _build_engine_data(text, font_name='ArialMT', font_size=25.0):
    """Minimal EngineData feleptese TypeLayer-hez."""
    text_cr = text + '\r'
    text_len = len(text_cr)

    ed = EngineData()

    # ResourceDict (font informacio)
    resource_dict = EDict()
    font_entry = EDict()
    font_entry[_prop('Name')] = _estr(font_name)
    font_entry[_prop('Script')] = _eint(0)
    font_entry[_prop('FontType')] = _eint(0)
    font_entry[_prop('Synthetic')] = _eint(0)
    fontset = EList()
    fontset.append(font_entry)
    resource_dict[_prop('FontSet')] = fontset
    resource_dict[_prop('TheNormalStyleSheet')] = _eint(0)
    resource_dict[_prop('TheNormalParagraphSheet')] = _eint(0)

    # Editor
    editor_dict = EDict()
    editor_dict[_prop('Text')] = _estr(text_cr)

    # StyleRun
    style_data = EDict()
    style_data[_prop('Font')] = _eint(0)
    style_data[_prop('FontSize')] = _efloat(font_size)
    style_data[_prop('AutoLeading')] = Bool(True)
    fill_vals = EList()
    for v in [1.0, 0.0, 0.0, 0.0]:
        fill_vals.append(_efloat(v))
    fill_color = EDict()
    fill_color[_prop('Type')] = _eint(1)
    fill_color[_prop('Values')] = fill_vals
    style_data[_prop('FillColor')] = fill_color

    stylesheet = EDict()
    stylesheet[_prop('StyleSheetData')] = style_data
    run_item = EDict()
    run_item[_prop('StyleSheet')] = stylesheet
    run_array = EList()
    run_array.append(run_item)
    style_run = EDict()
    style_run[_prop('RunArray')] = run_array
    run_lengths = EList()
    run_lengths.append(_eint(text_len))
    style_run[_prop('RunLengthArray')] = run_lengths

    # ParagraphRun
    para_props = EDict()
    para_props[_prop('Justification')] = _eint(0)
    para_sheet = EDict()
    para_sheet[_prop('DefaultStyleSheet')] = _eint(0)
    para_sheet[_prop('Properties')] = para_props
    para_item = EDict()
    para_item[_prop('ParagraphSheet')] = para_sheet
    para_array = EList()
    para_array.append(para_item)
    para_run = EDict()
    para_run[_prop('RunArray')] = para_array
    para_lengths = EList()
    para_lengths.append(_eint(text_len))
    para_run[_prop('RunLengthArray')] = para_lengths

    # EngineDict
    engine_dict = EDict()
    engine_dict[_prop('Editor')] = editor_dict
    engine_dict[_prop('StyleRun')] = style_run
    engine_dict[_prop('ParagraphRun')] = para_run
    engine_dict[_prop('ResourceDict')] = resource_dict

    ed[_prop('EngineDict')] = engine_dict
    return ed


def create_type_layer(psd, layer_name, display_text,
                      font_name='ArialMT', font_size=25.0):
    """
    TypeLayer (szoveg layer) letrehozasa.
    - layer_name: PSD layer nev (pl. 'kiss-janos---42')
    - display_text: megjelenített szöveg (pl. 'Kiss János')
    - font_name: betutipus (alapertelmezett: ArialMT)
    - font_size: betumeret pt-ben (alapertelmezett: 25)
    """
    ed = _build_engine_data(display_text, font_name, font_size)
    buf = io.BytesIO()
    ed.write(buf)
    ed_bytes = buf.getvalue()

    # text_data descriptor (EngineData + Txt)
    text_data = DescriptorBlock(name='', classID=b'TxLr', version=16)
    text_data[b'EngineData'] = RawData(ed_bytes)
    text_data[b'Txt '] = DescString(value=display_text + '\r')

    # warp descriptor (ures)
    warp_data = DescriptorBlock(name='warp', classID=b'warp', version=16)

    # TypeToolObjectSetting
    ttos = TypeToolObjectSetting(
        version=1,
        transform=(1.0, 0.0, 0.0, 1.0, 0.0, 0.0),
        text_version=50,
        text_data=text_data,
        warp_version=1,
        warp=warp_data,
        left=0, top=0, right=0, bottom=0,
    )

    # Tagged blocks
    tagged = TaggedBlocks()
    tagged[Tag.TYPE_TOOL_OBJECT_SETTING] = TaggedBlock(
        key=Tag.TYPE_TOOL_OBJECT_SETTING,
        data=ttos,
    )

    # Channel info (ures, TypeLayer-nek nincs pixel adata)
    empty_channel = ChannelData(compression=Compression.RAW, data=b'')
    channel_info = [
        ChannelInfo(id=ChannelID.TRANSPARENCY_MASK, length=2),
        ChannelInfo(id=ChannelID.CHANNEL_0, length=2),
        ChannelInfo(id=ChannelID.CHANNEL_1, length=2),
        ChannelInfo(id=ChannelID.CHANNEL_2, length=2),
    ]

    record = LayerRecord(
        top=0, left=0, bottom=0, right=0,
        channel_info=channel_info,
        blend_mode=BlendMode.NORMAL,
        opacity=255,
        name=layer_name,
        tagged_blocks=tagged,
    )

    channel_data = ChannelDataList([
        empty_channel, empty_channel, empty_channel, empty_channel,
    ])

    return TypeLayer(psd, record, channel_data)


def create_name_layers(psd, persons):
    """Students + Teachers csoport TypeLayer-ekkel a Names/ szamara."""
    student_layers = []
    teacher_layers = []

    for p in persons:
        slug = sanitize_name(p['name'], p['id'])
        layer = create_type_layer(psd, slug, p['name'])
        if p['type'] == 'teacher':
            teacher_layers.append(layer)
        else:
            student_layers.append(layer)

    students = psd.create_group(
        name='Students', layer_list=student_layers or None)
    teachers = psd.create_group(
        name='Teachers', layer_list=teacher_layers or None)
    return [students, teachers]


def create_empty_sub_pair(psd):
    """Ures Students + Teachers almappa par."""
    students = psd.create_group(name='Students')
    teachers = psd.create_group(name='Teachers')
    return [students, teachers]


def main() -> None:
    parser = argparse.ArgumentParser(
        description='Ures PSD fajl generalasa tablohoz')
    parser.add_argument('--width-cm', type=float, required=True)
    parser.add_argument('--height-cm', type=float, required=True)
    parser.add_argument('--dpi', type=int, default=200)
    parser.add_argument('--mode', type=str, default='RGB')
    parser.add_argument('--output', type=str, required=True)
    parser.add_argument('--persons-json', type=str, default=None,
                        help='JSON fajl a szemelyek listajával')
    args = parser.parse_args()

    print(f'[DEBUG] Script indulas: width={args.width_cm}cm, '
          f'height={args.height_cm}cm, dpi={args.dpi}, mode={args.mode}')
    print(f'[DEBUG] Output: {args.output}')
    print(f'[DEBUG] Persons JSON: {args.persons_json or "NINCS"}')

    width_px = cm_to_px(args.width_cm, args.dpi)
    height_px = cm_to_px(args.height_cm, args.dpi)
    print(f'[DEBUG] Pixel meret: {width_px}x{height_px}px')

    if width_px <= 0 or height_px <= 0:
        print(f'Hibas meret: {width_px}x{height_px}px', file=sys.stderr)
        sys.exit(1)

    if width_px > 300000 or height_px > 300000:
        print(f'Tul nagy meret: {width_px}x{height_px}px (max 300000)',
              file=sys.stderr)
        sys.exit(1)

    mode = args.mode.upper()
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    print(f'[DEBUG] Output mappa letezik: {output_path.parent}')

    # Szemelyek betoltese JSON-bol (ha megadtak)
    persons = None
    if args.persons_json:
        json_path = Path(args.persons_json)
        if not json_path.exists():
            print(f'[DEBUG] HIBA: Persons JSON nem letezik: {json_path}')
            print(f'Szemelyek JSON fajl nem talalhato: {json_path}',
                  file=sys.stderr)
            sys.exit(1)
        with open(json_path, 'r', encoding='utf-8') as f:
            raw = f.read()
            persons = json.loads(raw)
        students = [p for p in persons if p.get('type') != 'teacher']
        teachers = [p for p in persons if p.get('type') == 'teacher']
        print(f'[DEBUG] Persons JSON beolvasva: {len(persons)} fo '
              f'({len(students)} diak, {len(teachers)} tanar)')
        if persons:
            print(f'[DEBUG] Elso 3 szemely: '
                  f'{[p["name"] for p in persons[:3]]}')
    else:
        print('[DEBUG] Nincs persons-json parameter — ures Names/ mappastruktura')

    # --- PSD letrehozasa ---
    print(f'[DEBUG] PSD letrehozasa: {width_px}x{height_px}px, {mode}')
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
    print(f'[DEBUG] DPI beallitva: {args.dpi}')

    # --- Mappastruktura ---
    print('[DEBUG] Backgrounds/ csoport letrehozasa')
    backgrounds = psd.create_group(name='Backgrounds')

    print('[DEBUG] Images/ csoport letrehozasa (Students + Teachers)')
    images = psd.create_group(
        layer_list=create_empty_sub_pair(psd), name='Images')

    print('[DEBUG] Positions/ csoport letrehozasa (Students + Teachers)')
    positions = psd.create_group(
        layer_list=create_empty_sub_pair(psd), name='Positions')

    # Names/ (TypeLayer-ekkel ha vannak szemelyek)
    if persons:
        print(f'[DEBUG] Names/ csoport letrehozasa TypeLayer-ekkel '
              f'({len(persons)} szemely)')
        try:
            name_layers = create_name_layers(psd, persons)
            print(f'[DEBUG] Name layerek elkeszultek: '
                  f'{len(name_layers)} alcsoport')
            names = psd.create_group(
                layer_list=name_layers, name='Names')
            print('[DEBUG] Names/ csoport hozzaadva')
        except Exception as e:
            print(f'[DEBUG] HIBA Names/ letrehozasanal: {e}',
                  flush=True)
            raise
    else:
        print('[DEBUG] Names/ csoport letrehozasa (ures, nincs szemely)')
        names = psd.create_group(
            layer_list=create_empty_sub_pair(psd), name='Names')

    print('[DEBUG] Subtitles/ csoport letrehozasa')
    subtitles = psd.create_group(name='Subtitles')

    # Csoportok hozzaadasa (Photoshop-ban alulrol felfele jelenik meg)
    print('[DEBUG] Csoportok hozzaadasa a PSD-hez...')
    psd.append(backgrounds)
    psd.append(images)
    psd.append(positions)
    psd.append(names)
    psd.append(subtitles)
    print('[DEBUG] Minden csoport hozzaadva')

    # --- Mentes ---
    print(f'[DEBUG] PSD mentes: {output_path}')
    psd.save(str(output_path))

    file_size = output_path.stat().st_size
    person_info = f', {len(persons)} szemely' if persons else ''
    print(f'[DEBUG] PSD mentve! Meret: {file_size} byte')
    print(f'PSD letrehozva: {output_path} '
          f'({width_px}x{height_px}px, {args.dpi} DPI, {mode}{person_info})')


if __name__ == '__main__':
    main()
