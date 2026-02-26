import { ICONS } from '@shared/constants/icons.constants';

export interface CommandItem {
  id: string;
  icon: string;
  label: string;
  shortcut?: string;
  accent?: 'green' | 'purple' | 'amber' | 'red' | 'blue';
  badge?: string;
}

export interface CommandSection {
  id: string;
  icon: string;
  label: string;
  items: CommandItem[];
}

export const COMMAND_SECTIONS: CommandSection[] = [
  {
    id: 'photoshop',
    icon: ICONS.MONITOR,
    label: 'Photoshop',
    items: [
      { id: 'sync-photos', icon: ICONS.IMAGE_DOWN, label: 'Fotók szinkronizálása', shortcut: '⌘⇧S', accent: 'green' },
      { id: 'arrange-names', icon: ICONS.ALIGN_CENTER, label: 'Nevek igazítása', shortcut: '⌘⇧N', accent: 'purple' },
      { id: 'update-positions', icon: ICONS.TAG, label: 'Pozíciók frissítése', shortcut: '⌘⇧P', accent: 'amber' },
      { id: 'open-project', icon: ICONS.FILE_PLUS, label: 'PSD megnyitása', shortcut: '⌘O' },
      { id: 'open-workdir', icon: ICONS.FOLDER_OPEN, label: 'Munkamappa megnyitása' },
      { id: 'refresh', icon: ICONS.REFRESH, label: 'Frissítés PS-ből', shortcut: '⌘R' },
    ],
  },
  {
    id: 'sort',
    icon: ICONS.ARROW_DOWN_AZ,
    label: 'Rendezés',
    items: [
      { id: 'sort-abc', icon: ICONS.ARROW_DOWN_AZ, label: 'ABC sorrend', accent: 'blue' },
      { id: 'sort-gender', icon: ICONS.USERS, label: 'Felváltva fiú-lány', accent: 'purple' },
      { id: 'sort-custom', icon: ICONS.LIST_ORDERED, label: 'Egyedi sorrend' },
      { id: 'arrange-grid', icon: ICONS.LAYOUT_GRID, label: 'Rácsba rendezés' },
    ],
  },
  {
    id: 'align',
    icon: ICONS.ALIGN_CENTER_V,
    label: 'Igazítás',
    items: [
      { id: 'align-left', icon: ICONS.ALIGN_START_V, label: 'Balra igazítás' },
      { id: 'align-center-h', icon: ICONS.ALIGN_CENTER_V, label: 'Vízszintes középre' },
      { id: 'align-right', icon: ICONS.ALIGN_END_V, label: 'Jobbra igazítás' },
      { id: 'align-top', icon: ICONS.ALIGN_START_H, label: 'Felülre igazítás' },
      { id: 'align-center-v', icon: ICONS.ALIGN_CENTER_H, label: 'Függőleges középre' },
      { id: 'align-bottom', icon: ICONS.ALIGN_END_H, label: 'Alulra igazítás' },
      { id: 'distribute-h', icon: ICONS.ALIGN_H_DISTRIBUTE, label: 'Vízszintes elosztás' },
      { id: 'distribute-v', icon: ICONS.ALIGN_V_DISTRIBUTE, label: 'Függőleges elosztás' },
      { id: 'center-document', icon: ICONS.MOVE, label: 'Dokumentum középre' },
    ],
  },
  {
    id: 'generate',
    icon: ICONS.ZAPS,
    label: 'Generálás',
    items: [
      { id: 'generate-sample', icon: ICONS.IMAGE, label: 'Minta generálása', shortcut: '⌘M', accent: 'amber', badge: 'HD' },
      { id: 'generate-final', icon: ICONS.CHECK_CIRCLE, label: 'Véglegesítés', shortcut: '⌘⇧F', accent: 'green', badge: 'F+K' },
    ],
  },
  {
    id: 'layers',
    icon: ICONS.LAYERS,
    label: 'Layerek',
    items: [
      { id: 'upload-photo', icon: ICONS.CAMERA, label: 'Fotó feltöltése', accent: 'green' },
      { id: 'link-layers', icon: ICONS.LINK, label: 'Layerek összelinkelése' },
      { id: 'unlink-layers', icon: ICONS.UNLINK, label: 'Linkelés megszüntetése' },
      { id: 'extra-names', icon: ICONS.FILE_TEXT, label: 'Extra nevek szerkesztése' },
    ],
  },
  {
    id: 'view',
    icon: ICONS.GRID,
    label: 'Nézet',
    items: [
      { id: 'toggle-grid', icon: ICONS.GRID, label: 'Rács be/ki', shortcut: 'G' },
      { id: 'snap-grid', icon: ICONS.WAND, label: 'Rácsba igazít' },
      { id: 'save', icon: ICONS.SAVE, label: 'Mentés', shortcut: '⌘S', accent: 'purple' },
    ],
  },
  {
    id: 'batch',
    icon: ICONS.SPARKLES,
    label: 'Batch műveletek',
    items: [
      { id: 'batch-actions', icon: ICONS.WAND, label: 'Akciók megnyitása', accent: 'amber' },
      { id: 'bulk-photos', icon: ICONS.IMAGES, label: 'Tömeges fotó feltöltés' },
    ],
  },
];
