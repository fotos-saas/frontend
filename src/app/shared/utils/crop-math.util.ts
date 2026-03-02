/**
 * Megosztott crop matematikai számítások.
 * Egyetlen forrás a crop téglalap számításhoz — Angular és Electron handler egyaránt használja.
 */

export interface CropRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface CropFaceLandmarksInput {
  forehead: { x: number; y: number };
  chin: { x: number; y: number };
  left_ear: { x: number; y: number };
  right_ear: { x: number; y: number };
  face_center: { x: number; y: number };
  face_width: number;
  face_height: number;
}

export interface CropSettingsInput {
  head_padding_top: number;
  chin_padding_bottom: number;
  shoulder_width: number;
  face_position_y: number;
  aspect_ratio: string;
}

/** Aspect ratio parse ("4:5" -> 0.8, "3:4" -> 0.75) */
export function parseAspectRatio(ratio: string): number {
  const parts = ratio.split(':');
  if (parts.length !== 2) return 0.8;
  const w = parseFloat(parts[0]);
  const h = parseFloat(parts[1]);
  if (isNaN(w) || isNaN(h) || h === 0) return 0.8;
  return w / h;
}

/**
 * Crop téglalap számítás arc landmark-ok és beállítások alapján.
 * Az eredeti kép pixelkoordinátáiban adja vissza a crop téglalapot.
 */
export function computeCropRect(
  face: CropFaceLandmarksInput,
  imgWidth: number,
  imgHeight: number,
  settings: CropSettingsInput,
): CropRect {
  const headPad = settings.head_padding_top;
  const chinPad = settings.chin_padding_bottom;
  const shoulderW = settings.shoulder_width;
  const facePosY = settings.face_position_y;
  const ar = parseAspectRatio(settings.aspect_ratio);

  const faceH = face.face_height;
  const faceW = face.face_width;
  const faceCX = face.face_center.x;

  // Teljes "fej + váll" magasság: fej + padding top + padding bottom
  const totalContentH = faceH * (1 + headPad + chinPad);

  // A crop magassága: az arcközép a face_position_y arányban legyen
  const cropH = totalContentH / (1 - (1 - facePosY) * 0.3);

  // A crop szélessége: aspect ratio alapján
  const cropW = cropH * ar;

  // Minimális szélesség: váll arány * arcszélesség
  const minW = faceW * shoulderW * 2.2;
  const finalW = Math.max(cropW, minW);
  const finalH = finalW / ar;

  // Az arc teteje (homlok) a crop tetejétől headPaddingTop * faceH-ra legyen
  const cropTop = face.forehead.y - headPad * faceH;

  // Középre igazítás vízszintesen
  const cropLeft = faceCX - finalW / 2;

  // Kerekítés és clamp
  let left = Math.round(Math.max(0, cropLeft));
  let top = Math.round(Math.max(0, cropTop));
  let width = Math.round(Math.min(finalW, imgWidth - left));
  let height = Math.round(Math.min(finalH, imgHeight - top));

  // Ha a crop kilóg alul, toljuk feljebb
  if (top + height > imgHeight) top = Math.max(0, imgHeight - height);
  // Ha a crop kilóg jobbra, toljuk balra
  if (left + width > imgWidth) left = Math.max(0, imgWidth - width);

  // Biztosítsuk az aspect ratio-t a végleges crop-ban
  const currentRatio = width / height;
  if (currentRatio > ar) {
    width = Math.round(height * ar);
    left = Math.round(Math.max(0, faceCX - width / 2));
    if (left + width > imgWidth) left = imgWidth - width;
  } else if (currentRatio < ar) {
    height = Math.round(width / ar);
    if (top + height > imgHeight) top = Math.max(0, imgHeight - height);
  }

  return {
    left: Math.max(0, left),
    top: Math.max(0, top),
    width: Math.max(1, Math.min(width, imgWidth)),
    height: Math.max(1, Math.min(height, imgHeight)),
  };
}
