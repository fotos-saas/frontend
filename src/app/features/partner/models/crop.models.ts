/**
 * Automatikus portrévágás típusok és preset-ek.
 */

export type CropPreset = 'school_portrait' | 'yearbook' | 'passport' | 'headshot' | 'custom';

export type AspectRatio = '3:4' | '4:5' | '2:3' | '1:1' | '5:7';

export type NoFaceAction = 'skip' | 'center_crop' | 'original';

export type MultiFaceAction = 'largest' | 'first' | 'skip';

export interface CropSettings {
  enabled: boolean;
  preset: CropPreset;
  head_padding_top: number;
  chin_padding_bottom: number;
  shoulder_width: number;
  face_position_y: number;
  aspect_ratio: AspectRatio;
  output_quality: number;
  no_face_action: NoFaceAction;
  multi_face_action: MultiFaceAction;
}

export interface CropSettingsResponse {
  success: boolean;
  data: {
    enabled: boolean;
    settings: CropSettings;
  };
}

export interface UpdateCropSettingsResponse {
  success: boolean;
  message?: string;
  data: {
    enabled: boolean;
    settings: CropSettings;
  };
}

/** Preset alapértelmezések */
export const CROP_PRESETS: Record<CropPreset, Omit<CropSettings, 'enabled'>> = {
  school_portrait: {
    preset: 'school_portrait',
    head_padding_top: 0.25,
    chin_padding_bottom: 0.40,
    shoulder_width: 0.85,
    face_position_y: 0.38,
    aspect_ratio: '4:5',
    output_quality: 95,
    no_face_action: 'skip',
    multi_face_action: 'largest',
  },
  yearbook: {
    preset: 'yearbook',
    head_padding_top: 0.20,
    chin_padding_bottom: 0.35,
    shoulder_width: 0.75,
    face_position_y: 0.35,
    aspect_ratio: '3:4',
    output_quality: 95,
    no_face_action: 'skip',
    multi_face_action: 'largest',
  },
  passport: {
    preset: 'passport',
    head_padding_top: 0.30,
    chin_padding_bottom: 0.50,
    shoulder_width: 0.90,
    face_position_y: 0.40,
    aspect_ratio: '3:4',
    output_quality: 95,
    no_face_action: 'skip',
    multi_face_action: 'largest',
  },
  headshot: {
    preset: 'headshot',
    head_padding_top: 0.15,
    chin_padding_bottom: 0.25,
    shoulder_width: 0.60,
    face_position_y: 0.35,
    aspect_ratio: '1:1',
    output_quality: 95,
    no_face_action: 'skip',
    multi_face_action: 'largest',
  },
  custom: {
    preset: 'custom',
    head_padding_top: 0.25,
    chin_padding_bottom: 0.40,
    shoulder_width: 0.85,
    face_position_y: 0.38,
    aspect_ratio: '4:5',
    output_quality: 95,
    no_face_action: 'skip',
    multi_face_action: 'largest',
  },
};

export const EMPTY_CROP_SETTINGS: CropSettings = {
  enabled: false,
  ...CROP_PRESETS.school_portrait,
};
