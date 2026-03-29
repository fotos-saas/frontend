/**
 * JsxDataPreparerService — Személy/kép adat előkészítés JSX scriptek számára
 */

import log from 'electron-log/main';
import { downloadPhoto } from './photo-download.service';

/** Minimális store interfész — elkerüli a cirkuláris importot jsx-runner.service.ts-sel */
export interface PhotoshopStoreReader {
  get(key: 'tabloNameBreakAfter', defaultValue: number): number;
  get(key: 'tabloTextAlign', defaultValue: string): string;
  get(key: string, defaultValue?: unknown): unknown;
}

// ============ Types ============

export interface PersonData {
  id: number;
  name: string;
  type: string;
}

export interface PersonWithPhoto extends PersonData {
  photoUrl?: string | null;
}

export interface ImageSizeConfig {
  widthCm: number;
  heightCm: number;
  dpi: number;
  studentSizeCm?: number;
  teacherSizeCm?: number;
}

export interface PreparedPersons {
  layers: Array<{ layerName: string; displayText: string; group: string }>;
  textAlign: string;
  stats: { students: number; teachers: number; total: number };
}

export interface PreparedImageLayers {
  layers: Array<{ layerName: string; group: string; widthPx: number; heightPx: number; photoPath: string | null }>;
  stats: { students: number; teachers: number; total: number; withPhoto: number };
  imageSizeCm: ImageSizeConfig;
  studentSizeCm: number;
  teacherSizeCm: number;
}

// ============ Functions ============

export function sanitizeNameForLayer(text: string, personId?: number): string {
  let result = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0150/g, 'O').replace(/\u0151/g, 'o')
    .replace(/\u0170/g, 'U').replace(/\u0171/g, 'u')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (personId !== undefined) {
    result += `---${personId}`;
  }
  return result;
}

export function breakName(name: string, breakAfter: number): string {
  if (breakAfter <= 0) return name;
  const words = name.split(' ');
  if (words.length < 2) return name;
  const isPrefix = (w: string) => w.replace(/\./g, '').length <= 2;
  const realCount = words.filter(w => !isPrefix(w)).length;
  if (realCount < 3) return name;
  const hyphenIndex = words.findIndex(w => w.indexOf('-') !== -1);
  if (hyphenIndex !== -1 && hyphenIndex < words.length - 1) {
    return words.slice(0, hyphenIndex + 1).join(' ') + '\r' + words.slice(hyphenIndex + 1).join(' ');
  }
  let realWordCount = 0;
  let breakIndex = -1;
  for (let i = 0; i < words.length; i++) {
    if (!isPrefix(words[i])) realWordCount++;
    if (realWordCount > breakAfter && breakIndex === -1) breakIndex = i;
  }
  if (breakIndex === -1) return name;
  return words.slice(0, breakIndex).join(' ') + '\r' + words.slice(breakIndex).join(' ');
}

export function preparePersonsForJsx(
  personsData: PersonData[],
  psStore: PhotoshopStoreReader,
): PreparedPersons {
  const breakAfterVal = psStore.get('tabloNameBreakAfter', 1);
  const textAlign = psStore.get('tabloTextAlign', 'center');
  const students = personsData.filter(p => p.type !== 'teacher');
  const teachers = personsData.filter(p => p.type === 'teacher');

  const layers = [
    ...students.map(p => ({
      layerName: sanitizeNameForLayer(p.name, p.id),
      displayText: breakName(p.name, breakAfterVal),
      group: 'Students',
    })),
    ...teachers.map(p => ({
      layerName: sanitizeNameForLayer(p.name, p.id),
      displayText: breakName(p.name, breakAfterVal),
      group: 'Teachers',
    })),
  ];

  return {
    layers,
    textAlign,
    stats: { students: students.length, teachers: teachers.length, total: personsData.length },
  };
}

export async function prepareImageLayersForJsx(
  personsData: PersonWithPhoto[],
  imageSizeCm: ImageSizeConfig,
  docDpi: number = 200,
): Promise<PreparedImageLayers> {
  const students = personsData.filter(p => p.type !== 'teacher');
  const teachers = personsData.filter(p => p.type === 'teacher');

  const widthPx = Math.round((imageSizeCm.widthCm / 2.54) * docDpi);
  const heightPx = Math.round((imageSizeCm.heightCm / 2.54) * docDpi);

  const allPersons = [...students, ...teachers];
  const downloadResults = await Promise.all(
    allPersons.map(async (p) => {
      if (!p.photoUrl) return null;
      try {
        const layerName = sanitizeNameForLayer(p.name, p.id);
        const ext = p.photoUrl.split('.').pop()?.split('?')[0] || 'jpg';
        const fileName = `${layerName}.${ext}`;
        return await downloadPhoto(p.photoUrl, fileName, { width: widthPx, height: heightPx });
      } catch (err) {
        log.warn(`Foto letoltes sikertelen (${p.name}):`, err);
        return null;
      }
    }),
  );

  const layers = allPersons.map((p, idx) => ({
    layerName: sanitizeNameForLayer(p.name, p.id),
    group: p.type === 'teacher' ? 'Teachers' : 'Students',
    widthPx,
    heightPx,
    photoPath: downloadResults[idx] || null,
  }));

  const withPhoto = downloadResults.filter(r => r !== null).length;

  return {
    layers,
    stats: { students: students.length, teachers: teachers.length, total: personsData.length, withPhoto },
    imageSizeCm,
    studentSizeCm: imageSizeCm.studentSizeCm || 0,
    teacherSizeCm: imageSizeCm.teacherSizeCm || 0,
  };
}
