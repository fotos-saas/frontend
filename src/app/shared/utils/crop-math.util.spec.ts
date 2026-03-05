import { describe, it, expect } from 'vitest';
import { parseAspectRatio, computeCropRect, CropFaceLandmarksInput, CropSettingsInput } from './crop-math.util';

describe('crop-math.util', () => {

  // ============================================================================
  // parseAspectRatio
  // ============================================================================
  describe('parseAspectRatio', () => {
    it('"4:5" → 0.8', () => {
      expect(parseAspectRatio('4:5')).toBe(0.8);
    });

    it('"3:4" → 0.75', () => {
      expect(parseAspectRatio('3:4')).toBe(0.75);
    });

    it('"1:1" → 1', () => {
      expect(parseAspectRatio('1:1')).toBe(1);
    });

    it('"16:9" → ~1.778', () => {
      expect(parseAspectRatio('16:9')).toBeCloseTo(16 / 9, 3);
    });

    it('érvénytelen formátum → 0.8 (default)', () => {
      expect(parseAspectRatio('invalid')).toBe(0.8);
    });

    it('hiányzó szám → 0.8', () => {
      expect(parseAspectRatio('4:')).toBe(0.8);
    });

    it('üres string → 0.8', () => {
      expect(parseAspectRatio('')).toBe(0.8);
    });

    it('nulla nevező → 0.8', () => {
      expect(parseAspectRatio('4:0')).toBe(0.8);
    });

    it('három részből álló → 0.8', () => {
      expect(parseAspectRatio('4:5:6')).toBe(0.8);
    });

    it('tizedes értékeket is kezeli', () => {
      expect(parseAspectRatio('2.5:3')).toBeCloseTo(2.5 / 3, 3);
    });
  });

  // ============================================================================
  // computeCropRect
  // ============================================================================
  describe('computeCropRect', () => {
    const defaultFace: CropFaceLandmarksInput = {
      forehead: { x: 500, y: 200 },
      chin: { x: 500, y: 400 },
      left_ear: { x: 400, y: 300 },
      right_ear: { x: 600, y: 300 },
      face_center: { x: 500, y: 300 },
      face_width: 200,
      face_height: 200,
    };

    const defaultSettings: CropSettingsInput = {
      head_padding_top: 0.5,
      chin_padding_bottom: 1.0,
      shoulder_width: 0.5,
      face_position_y: 0.33,
      aspect_ratio: '4:5',
    };

    it('érvényes crop rect-et ad vissza', () => {
      const result = computeCropRect(defaultFace, 1000, 1000, defaultSettings);

      expect(result.left).toBeGreaterThanOrEqual(0);
      expect(result.top).toBeGreaterThanOrEqual(0);
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
    });

    it('nem lóg ki a kép méretéből', () => {
      const result = computeCropRect(defaultFace, 1000, 1000, defaultSettings);

      expect(result.left + result.width).toBeLessThanOrEqual(1000);
      expect(result.top + result.height).toBeLessThanOrEqual(1000);
    });

    it('szélső arc pozíciót kezeli (bal felső sarok)', () => {
      const edgeFace: CropFaceLandmarksInput = {
        forehead: { x: 50, y: 20 },
        chin: { x: 50, y: 120 },
        left_ear: { x: 20, y: 70 },
        right_ear: { x: 80, y: 70 },
        face_center: { x: 50, y: 70 },
        face_width: 60,
        face_height: 100,
      };
      const result = computeCropRect(edgeFace, 500, 500, defaultSettings);

      expect(result.left).toBeGreaterThanOrEqual(0);
      expect(result.top).toBeGreaterThanOrEqual(0);
    });

    it('szélső arc pozíciót kezeli (jobb alsó sarok)', () => {
      const edgeFace: CropFaceLandmarksInput = {
        forehead: { x: 950, y: 800 },
        chin: { x: 950, y: 900 },
        left_ear: { x: 900, y: 850 },
        right_ear: { x: 990, y: 850 },
        face_center: { x: 950, y: 850 },
        face_width: 90,
        face_height: 100,
      };
      const result = computeCropRect(edgeFace, 1000, 1000, defaultSettings);

      expect(result.left + result.width).toBeLessThanOrEqual(1000);
      expect(result.top + result.height).toBeLessThanOrEqual(1000);
    });

    it('minimális crop méret 1x1', () => {
      const tinyFace: CropFaceLandmarksInput = {
        forehead: { x: 10, y: 5 },
        chin: { x: 10, y: 7 },
        left_ear: { x: 9, y: 6 },
        right_ear: { x: 11, y: 6 },
        face_center: { x: 10, y: 6 },
        face_width: 2,
        face_height: 2,
      };
      const result = computeCropRect(tinyFace, 20, 20, defaultSettings);

      expect(result.width).toBeGreaterThanOrEqual(1);
      expect(result.height).toBeGreaterThanOrEqual(1);
    });

    it('1:1 aspect ratio-val négyzet crop-ot ad', () => {
      const squareSettings = { ...defaultSettings, aspect_ratio: '1:1' };
      const result = computeCropRect(defaultFace, 1000, 1000, squareSettings);

      // Kerekítés miatt kis eltérés megengedett
      expect(Math.abs(result.width - result.height)).toBeLessThanOrEqual(1);
    });
  });
});
