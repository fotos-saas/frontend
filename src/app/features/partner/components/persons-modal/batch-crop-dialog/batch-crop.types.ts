/**
 * Batch crop típusok — közös a component és az actions service között.
 */
import type { CropFaceLandmarks, CropQualityScores } from '../../../../../core/services/electron.types';

/** Batch crop fázisok */
export type CropPhase = 'idle' | 'downloading' | 'detecting' | 'cropping' | 'review' | 'uploading' | 'done' | 'error';

/** Review item: egy személy vágás eredménye */
export interface CropReviewItem {
  personId: number;
  personName: string;
  inputPath: string;
  outputPath: string;
  thumbnailPath: string;
  face: CropFaceLandmarks | null;
  quality: CropQualityScores | null;
  hasFace: boolean;
  eyesClosed: boolean;
  isBlurry: boolean;
  excluded: boolean;
  error?: string;
}

/** Feltöltés eredmény */
export interface CropUploadResult {
  personId: number;
  personName: string;
  success: boolean;
  error?: string;
}

/** Feltöltés konkurencia */
export const UPLOAD_CONCURRENCY = 3;
