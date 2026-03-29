/**
 * Photoshop handler — shared types + utility functions
 */

import * as fs from 'fs';
import * as path from 'path';
import log from 'electron-log/main';

// ============ Placed Photos JSON types ============

export interface PlacedPhotoEntry {
  mediaId: number | null;
  photoUrl: string;
  withFrame: boolean;
  placedAt: string;
}

export type PlacedPhotosMap = Record<string, PlacedPhotoEntry>;

// ============ Template types ============

export interface GlobalTemplate {
  version: number;
  type: 'template';
  id: string;
  templateName: string;
  createdAt: string;
  source: { documentName: string; widthPx: number; heightPx: number; dpi: number };
  board: { widthCm: number; heightCm: number; marginCm: number; gapHCm: number; gapVCm: number; gridAlign: string };
  nameSettings: { nameGapCm: number; textAlign: string; nameBreakAfter: number };
  studentSlots: Array<{ index: number; image: { x: number; y: number; width: number; height: number }; name: { x: number; y: number; width: number; height: number; justification: string } | null }>;
  teacherSlots: Array<{ index: number; image: { x: number; y: number; width: number; height: number }; name: { x: number; y: number; width: number; height: number; justification: string } | null }>;
  fixedLayers: Array<{ layerName: string; groupPath: string[]; x: number; y: number; width: number; height: number; kind: string }>;
}

export interface TemplateStoreSchema {
  globalTemplates: GlobalTemplate[];
}

// ============ Placed Photos JSON helpers ============

export function extractPersonId(layerName: string): number | null {
  const idx = layerName.indexOf('---');
  if (idx === -1) return null;
  const id = parseInt(layerName.substring(idx + 3), 10);
  return isNaN(id) ? null : id;
}

export function extractMediaId(photoUrl: string): number | null {
  const match = photoUrl.match(/\/storage\/(\d+)\//);
  return match ? parseInt(match[1], 10) : null;
}

export function updatePlacedPhotosJson(
  psdFilePath: string | undefined,
  jsxOutput: string | undefined,
  layers: Array<{ layerName: string; photoUrl: string }>,
  syncBorder: boolean,
): void {
  // PSD path meghatározása: params-ból vagy JSX output-ból
  let psdDir: string | undefined;

  if (psdFilePath) {
    psdDir = path.dirname(psdFilePath);
  } else if (jsxOutput) {
    // JSX output-ból PSD path kinyerése (CONFIG.PSD_FILE_PATH sorokból)
    const psdMatch = jsxOutput.match(/PSD_FILE_PATH[:\s]+"?([^"\n]+)"?/);
    if (psdMatch) {
      psdDir = path.dirname(psdMatch[1]);
    }
  }

  if (!psdDir) {
    log.info('Placed photos JSON: nincs PSD utvonal, kihagyva');
    return;
  }

  const jsonPath = path.join(psdDir, 'placed-photos.json');

  // Meglévő JSON beolvasása
  let existing: PlacedPhotosMap = {};
  try {
    if (fs.existsSync(jsonPath)) {
      existing = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    }
  } catch (err) {
    log.warn('Placed photos JSON olvasasi hiba, uj fajl lesz:', err);
  }

  // Frissítés a behelyezett fotókkal
  const now = new Date().toISOString();
  for (const layer of layers) {
    const personId = extractPersonId(layer.layerName);
    if (personId === null) continue;

    existing[String(personId)] = {
      mediaId: extractMediaId(layer.photoUrl),
      photoUrl: layer.photoUrl,
      withFrame: syncBorder,
      placedAt: now,
    };
  }

  // Visszaírás
  try {
    fs.writeFileSync(jsonPath, JSON.stringify(existing, null, 2), 'utf-8');
    log.info(`Placed photos JSON frissitve: ${jsonPath} (${Object.keys(existing).length} person)`);
  } catch (err) {
    log.error('Placed photos JSON irasi hiba:', err);
  }
}

// ============ Placed photos read helper (used by project + check-psd) ============

export function readPlacedPhotos(psdDir: string): {
  hasPlacedPhotos: boolean;
  placedPhotos: Record<string, number> | null;
  majorityWithFrame: boolean;
} {
  const placedJsonPath = path.join(psdDir, 'placed-photos.json');
  const hasPlacedPhotos = fs.existsSync(placedJsonPath);
  let placedPhotos: Record<string, number> | null = null;
  let majorityWithFrame = true;

  if (hasPlacedPhotos) {
    try {
      const raw: PlacedPhotosMap = JSON.parse(fs.readFileSync(placedJsonPath, 'utf-8'));
      placedPhotos = {};
      let framed = 0;
      let unframed = 0;
      for (const [personId, entry] of Object.entries(raw)) {
        if (entry.mediaId !== null) {
          placedPhotos[personId] = entry.mediaId;
        }
        if (entry.withFrame) framed++; else unframed++;
      }
      majorityWithFrame = framed >= unframed;
    } catch (err) {
      log.warn('placed-photos.json olvasási hiba:', err);
    }
  }

  return { hasPlacedPhotos, placedPhotos, majorityWithFrame };
}
