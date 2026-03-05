import { TestBed } from '@angular/core/testing';
import { ProjectModeService, ProjectModeInfo } from './project-mode.service';

/**
 * ProjectModeService unit tesztek
 *
 * Projekt módok: rendelés előtt/után, menüpont láthatóság.
 */
describe('ProjectModeService', () => {
  let service: ProjectModeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProjectModeService],
    });
    service = TestBed.inject(ProjectModeService);
  });

  describe('isOrderingMode', () => {
    it('true ha nincs minta és nincs rendelés', () => {
      expect(service.isOrderingMode({ samplesCount: 0, hasOrderData: false })).toBe(true);
    });

    it('false ha van minta', () => {
      expect(service.isOrderingMode({ samplesCount: 3, hasOrderData: false })).toBe(false);
    });

    it('false ha van rendelés adat', () => {
      expect(service.isOrderingMode({ samplesCount: 0, hasOrderData: true })).toBe(false);
    });

    it('false ha null a projekt', () => {
      expect(service.isOrderingMode(null)).toBe(false);
    });

    it('true ha hiányzó mezők (undefined)', () => {
      expect(service.isOrderingMode({})).toBe(true);
    });
  });

  describe('isOrderedMode', () => {
    it('az isOrderingMode inverze', () => {
      expect(service.isOrderedMode({ samplesCount: 0, hasOrderData: false })).toBe(false);
      expect(service.isOrderedMode({ samplesCount: 1, hasOrderData: false })).toBe(true);
    });

    it('false ha null a projekt', () => {
      expect(service.isOrderedMode(null)).toBe(false);
    });
  });

  describe('showSamples', () => {
    it('true ha van minta (samplesCount > 0)', () => {
      expect(service.showSamples({ samplesCount: 5 })).toBe(true);
    });

    it('false ha nincs minta', () => {
      expect(service.showSamples({ samplesCount: 0 })).toBe(false);
    });

    it('false ha null a projekt', () => {
      expect(service.showSamples(null)).toBe(false);
    });

    it('false ha undefined a samplesCount', () => {
      expect(service.showSamples({})).toBe(false);
    });
  });

  describe('showOrderData', () => {
    it('true ha rendelés után mód', () => {
      expect(service.showOrderData({ samplesCount: 1, hasOrderData: true })).toBe(true);
    });

    it('false ha rendelés előtt mód', () => {
      expect(service.showOrderData({ samplesCount: 0, hasOrderData: false })).toBe(false);
    });
  });

  describe('showTemplateChooser', () => {
    it('true ha rendelés előtt + hasTemplateChooser + nincs kiválasztott minta', () => {
      expect(
        service.showTemplateChooser({
          samplesCount: 0,
          hasOrderData: false,
          hasTemplateChooser: true,
          selectedTemplatesCount: 0,
        })
      ).toBe(true);
    });

    it('false ha van kiválasztott minta', () => {
      expect(
        service.showTemplateChooser({
          samplesCount: 0,
          hasOrderData: false,
          hasTemplateChooser: true,
          selectedTemplatesCount: 1,
        })
      ).toBe(false);
    });

    it('false ha nincs templateChooser', () => {
      expect(
        service.showTemplateChooser({
          samplesCount: 0,
          hasOrderData: false,
          hasTemplateChooser: false,
        })
      ).toBe(false);
    });

    it('false ha rendelés utáni módban vagyunk', () => {
      expect(
        service.showTemplateChooser({
          samplesCount: 1,
          hasOrderData: true,
          hasTemplateChooser: true,
          selectedTemplatesCount: 0,
        })
      ).toBe(false);
    });

    it('false ha null a projekt', () => {
      expect(service.showTemplateChooser(null)).toBe(false);
    });
  });

  describe('showMissingPersons', () => {
    it('true ha rendelés előtt + hasMissingPersons + van kiválasztott minta', () => {
      expect(
        service.showMissingPersons({
          samplesCount: 0,
          hasOrderData: false,
          hasMissingPersons: true,
          selectedTemplatesCount: 1,
        })
      ).toBe(true);
    });

    it('false ha nincs kiválasztott minta', () => {
      expect(
        service.showMissingPersons({
          samplesCount: 0,
          hasOrderData: false,
          hasMissingPersons: true,
          selectedTemplatesCount: 0,
        })
      ).toBe(false);
    });

    it('false ha nincs hiányzó személy', () => {
      expect(
        service.showMissingPersons({
          samplesCount: 0,
          hasOrderData: false,
          hasMissingPersons: false,
          selectedTemplatesCount: 1,
        })
      ).toBe(false);
    });

    it('false ha rendelés utáni módban', () => {
      expect(
        service.showMissingPersons({
          samplesCount: 1,
          hasMissingPersons: true,
          selectedTemplatesCount: 1,
        })
      ).toBe(false);
    });

    it('false ha null a projekt', () => {
      expect(service.showMissingPersons(null)).toBe(false);
    });
  });

  describe('canShowFinalization', () => {
    it('true ha rendelés előtti mód', () => {
      expect(service.canShowFinalization({ samplesCount: 0, hasOrderData: false })).toBe(true);
    });

    it('false ha rendelés utáni mód', () => {
      expect(service.canShowFinalization({ samplesCount: 1 })).toBe(false);
    });
  });

  describe('showVoting', () => {
    it('true ha van aktív szavazás', () => {
      expect(service.showVoting({ activePollsCount: 2 })).toBe(true);
    });

    it('false ha nincs aktív szavazás', () => {
      expect(service.showVoting({ activePollsCount: 0 })).toBe(false);
    });

    it('false ha undefined az activePollsCount', () => {
      expect(service.showVoting({})).toBe(false);
    });

    it('false ha null a projekt', () => {
      expect(service.showVoting(null)).toBe(false);
    });
  });
});
