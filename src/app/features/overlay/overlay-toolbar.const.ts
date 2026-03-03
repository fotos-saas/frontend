import { ICONS } from '@shared/constants/icons.constants';

export interface ToolbarItem {
  id: string;
  icon: string;
  label: string;
  tooltip?: string;
  accent?: 'green' | 'purple' | 'amber' | 'red' | 'blue';
}

export interface ToolbarGroup {
  id: string;
  items: ToolbarItem[];
  designerOnly?: boolean;
}

export const TOOLBAR_GROUPS: ToolbarGroup[] = [
  {
    id: 'align', designerOnly: true,
    items: [
      { id: 'align-left', icon: ICONS.ALIGN_START_V, label: 'Balra igazítás' },
      { id: 'align-center-h', icon: ICONS.ALIGN_CENTER_V, label: 'Vízszintes középre' },
      { id: 'align-right', icon: ICONS.ALIGN_END_V, label: 'Jobbra igazítás' },
      { id: 'align-top', icon: ICONS.ALIGN_START_H, label: 'Felülre igazítás' },
      { id: 'align-center-v', icon: ICONS.ALIGN_CENTER_H, label: 'Függőleges középre' },
      { id: 'align-bottom', icon: ICONS.ALIGN_END_H, label: 'Alulra igazítás' },
    ],
  },
  {
    id: 'distribute', designerOnly: true,
    items: [
      { id: 'distribute-h', icon: ICONS.ALIGN_H_DISTRIBUTE, label: 'Vízszintes elosztás' },
      { id: 'distribute-v', icon: ICONS.ALIGN_V_DISTRIBUTE, label: 'Függőleges elosztás' },
      { id: 'center-document', icon: ICONS.MOVE, label: 'Dokumentum középre' },
    ],
  },
  {
    id: 'sort', designerOnly: true,
    items: [
      { id: 'arrange-grid', icon: ICONS.LAYOUT_GRID, label: 'Rácsba rendezés', accent: 'purple' },
      { id: 'sort-abc', icon: ICONS.ARROW_DOWN_AZ, label: 'ABC sorrend', accent: 'blue' },
      { id: 'sort-gender', icon: ICONS.USERS, label: 'Felváltva fiú-lány' },
      { id: 'sort-custom', icon: ICONS.LIST_ORDERED, label: 'Egyedi sorrend' },
    ],
  },
  {
    id: 'layers', designerOnly: true,
    items: [
      { id: 'link-layers', icon: ICONS.LINK, label: 'Összelinkelés' },
      { id: 'unlink-layers', icon: ICONS.UNLINK, label: 'Szétlinkelés' },
      { id: 'extra-names', icon: ICONS.FILE_TEXT, label: 'Extra nevek' },
    ],
  },
  {
    id: 'photoshop',
    items: [
      { id: 'upload-photo', icon: ICONS.CAMERA, label: 'Fotó feltöltése', accent: 'green' },
      { id: 'sync-photos', icon: ICONS.IMAGE_DOWN, label: 'Fotók szinkronizálása', accent: 'green' },
      { id: 'refresh-placed-json', icon: ICONS.REFRESH, label: 'Placed JSON frissítése', tooltip: 'Placed-photos.json újragenerálása az aktuális API adatokból (Photoshop nem kell)', accent: 'blue' },
      { id: 'rename-layer-ids', icon: ICONS.REPLACE, label: 'Layer ID frissítés', tooltip: 'Régi layer ID-k cseréje az új DB ID-kra', accent: 'amber' },
      { id: 'refresh-roster', icon: ICONS.USERS, label: 'Névsor frissítés', tooltip: 'Új személyek hozzáadása, régiek törlése a PSD-ből', accent: 'blue' },
      { id: 'arrange-names', icon: ICONS.ALIGN_CENTER, label: 'Nevek igazítása', tooltip: 'Nevek a képek alá (kijelölt képeknél csak azokat, egyébként mindet). Unlinkeli a párokat.', accent: 'purple' },
      { id: 'sort-menu', icon: ICONS.ARROW_DOWN_AZ, label: 'Rendezés', tooltip: 'ABC / fiú-lány / rácsba rendezés', accent: 'blue' },
      { id: 'link-layers', icon: ICONS.LINK, label: 'Összelinkelés', tooltip: 'Kijelölt layerek összelinkelése az azonos nevű társaikkal' },
      { id: 'unlink-layers', icon: ICONS.UNLINK, label: 'Szétlinkelés', tooltip: 'Kijelölt layerek linkelésének megszüntetése' },
    ],
  },
  {
    id: 'generate',
    items: [
      { id: 'generate-sample', icon: ICONS.IMAGE, label: 'Minta generálása', accent: 'amber' },
      { id: 'generate-final', icon: ICONS.CHECK_CIRCLE, label: 'Véglegesítés', accent: 'green' },
    ],
  },
  {
    id: 'view', designerOnly: true,
    items: [
      { id: 'toggle-grid', icon: ICONS.GRID, label: 'Rács be/ki' },
      { id: 'snap-grid', icon: ICONS.WAND, label: 'Rácsba igazít' },
      { id: 'save', icon: ICONS.SAVE, label: 'Mentés', accent: 'purple' },
    ],
  },
];

export const ALIGN_MAP: Record<string, string> = {
  'align-left': 'left', 'align-center-h': 'centerH', 'align-right': 'right',
  'align-top': 'top', 'align-center-v': 'centerV', 'align-bottom': 'bottom',
};

export const SUBMENU_IDS = new Set([
  'arrange-names', 'sync-photos', 'generate-sample', 'generate-final', 'sort-menu', 'refresh-placed-json',
]);
