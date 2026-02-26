/**
 * Portré háttércsere beállítások típusai.
 * Az Electron desktop app Python sidecar-ral hajtja végre a feldolgozást.
 */

// ============================================
// HÁTTÉR TÍPUSOK
// ============================================

/** Háttér típus */
export type PortraitBackgroundType = 'preset' | 'color' | 'image' | 'gradient';

/** Feldolgozási mód */
export type PortraitMode = 'replace' | 'darken';

/** Gradient irány */
export type GradientDirection = 'vertical' | 'horizontal' | 'radial';

/** Elérhető preset háttér nevek */
export type PresetName = 'dark_gray' | 'charcoal' | 'navy' | 'dark_blue' | 'black' | 'white' | 'light_gray';

// ============================================
// PRESET HÁTTÉR DEFINÍCIÓK
// ============================================

export interface PresetBackground {
  name: PresetName;
  label: string;
  color: string;
}

/** Elérhető preset hátterek */
export const PRESET_BACKGROUNDS: PresetBackground[] = [
  { name: 'black', label: 'Fekete', color: '#000000' },
  { name: 'charcoal', label: 'Antracit', color: '#36454F' },
  { name: 'dark_gray', label: 'Sötétszürke', color: '#555555' },
  { name: 'navy', label: 'Sötétkék', color: '#1B2838' },
  { name: 'dark_blue', label: 'Kék', color: '#1A3A5C' },
  { name: 'white', label: 'Fehér', color: '#FFFFFF' },
  { name: 'light_gray', label: 'Világosszürke', color: '#D3D3D3' },
];

// ============================================
// BEÁLLÍTÁSOK INTERFACE
// ============================================

/** Portré feldolgozás beállítások (backend-ről jövő/menő adat) */
export interface PortraitSettings {
  enabled: boolean;
  mode: PortraitMode;
  background_type: PortraitBackgroundType;

  // Preset háttér
  preset_name?: PresetName | null;

  // Egyedi szín (RGB)
  color_r?: number | null;
  color_g?: number | null;
  color_b?: number | null;

  // Gradient
  gradient_start_r?: number | null;
  gradient_start_g?: number | null;
  gradient_start_b?: number | null;
  gradient_end_r?: number | null;
  gradient_end_g?: number | null;
  gradient_end_b?: number | null;
  gradient_direction?: GradientDirection | null;

  // Él feldolgozás
  edge_inset: number;
  feather_radius: number;
  decontaminate: boolean;
  decontaminate_strength: number;
  hair_refinement: boolean;
  hair_refinement_strength: number;
  edge_smoothing: number;

  // Árnyék
  add_shadow: boolean;
  shadow_opacity: number;

  // Darken mód
  darken_amount?: number | null;
  target_brightness?: number | null;

  // Kimenet
  output_quality: number;
}

// ============================================
// API VÁLASZ TÍPUSOK
// ============================================

/** GET /partner/portrait-settings válasz */
export interface PortraitSettingsResponse {
  success: boolean;
  data: {
    enabled: boolean;
    settings: PortraitSettings;
    has_background_image: boolean;
    background_image_url: string | null;
    background_thumb_url: string | null;
  };
}

/** PUT /partner/portrait-settings válasz */
export type UpdatePortraitSettingsResponse = PortraitSettingsResponse & {
  message: string;
};

/** POST /partner/portrait-background válasz */
export interface UploadPortraitBackgroundResponse {
  success: boolean;
  message: string;
  data: {
    url: string;
    thumb_url: string;
  };
}

/** DELETE /partner/portrait-background válasz */
export interface DeletePortraitBackgroundResponse {
  success: boolean;
  message: string;
}

// ============================================
// ÜRES BEÁLLÍTÁSOK (init placeholder — a valós default-ot a backend adja)
// ============================================

/** Üres init érték a signal-hez. A load() felülírja a backend-ből jövő valós default-okkal. */
export const EMPTY_PORTRAIT_SETTINGS: PortraitSettings = {
  enabled: false,
  mode: 'replace',
  background_type: 'preset',
  edge_inset: 0,
  feather_radius: 0,
  decontaminate: false,
  decontaminate_strength: 0,
  hair_refinement: false,
  hair_refinement_strength: 0,
  edge_smoothing: 0,
  add_shadow: false,
  shadow_opacity: 0,
  output_quality: 95,
};
