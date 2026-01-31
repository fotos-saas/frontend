/**
 * SamplesComponent Unit Tests
 *
 * Tesztek:
 * - Komponens létrehozás
 * - Adatok betöltése
 * - Lightbox kezelés (nyitás/zárás/navigáció)
 * - Relative time formázás
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SamplesComponent } from './samples.component';
import { SamplesService, Sample, ProjectInfo } from './services/samples.service';
import { of, throwError } from 'rxjs';

describe('SamplesComponent', () => {
  let component: SamplesComponent;
  let fixture: ComponentFixture<SamplesComponent>;
  let samplesServiceSpy: {
    getSamples: ReturnType<typeof vi.fn>;
    getProjectInfo: ReturnType<typeof vi.fn>;
  };

  // Mock adatok
  const mockSamples: Sample[] = [
    {
      id: 1,
      fileName: 'sample1.jpg',
      url: 'https://example.com/sample1.jpg',
      thumbUrl: 'https://example.com/thumb1.jpg',
      description: '<p>Első minta</p>',
      createdAt: '2026-01-01T10:00:00Z'
    },
    {
      id: 2,
      fileName: 'sample2.jpg',
      url: 'https://example.com/sample2.jpg',
      thumbUrl: 'https://example.com/thumb2.jpg',
      description: null,
      createdAt: '2026-01-02T10:00:00Z'
    },
    {
      id: 3,
      fileName: 'sample3.jpg',
      url: 'https://example.com/sample3.jpg',
      thumbUrl: 'https://example.com/thumb3.jpg',
      description: '<p>Harmadik minta <strong>fontos</strong></p>',
      createdAt: '2026-01-03T10:00:00Z'
    }
  ];

  const mockProjectInfo: ProjectInfo = {
    id: 1,
    name: 'Teszt Projekt',
    schoolName: 'Teszt Iskola',
    className: '12.A',
    classYear: '2026',
    status: 'active',
    hasOrderAnalysis: false,
    samplesCount: 3,
    hasMissingPersons: false,
    tabloStatus: null,
    userStatus: null,
    userStatusColor: null
  };

  beforeEach(async () => {
    samplesServiceSpy = {
      getSamples: vi.fn(),
      getProjectInfo: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [SamplesComponent, HttpClientTestingModule],
      providers: [
        { provide: SamplesService, useValue: samplesServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SamplesComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================
  // COMPONENT CREATION TESTS
  // ===========================================

  describe('Component Creation', () => {
    it('should create the component', () => {
      samplesServiceSpy.getSamples.mockReturnValue(of({ success: true, data: [] }));
      samplesServiceSpy.getProjectInfo.mockReturnValue(of({ success: true, data: mockProjectInfo }));
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });

    it('should initialize with loading state', () => {
      samplesServiceSpy.getSamples.mockReturnValue(of({ success: true, data: [] }));
      samplesServiceSpy.getProjectInfo.mockReturnValue(of({ success: true, data: mockProjectInfo }));

      expect(component.loading).toBe(true);
      expect(component.samples).toEqual([]);
      expect(component.selectedIndex).toBeNull();
    });
  });

  // ===========================================
  // DATA LOADING TESTS
  // ===========================================

  describe('Data Loading', () => {
    it('should load samples on init', async () => {
      samplesServiceSpy.getSamples.mockReturnValue(of({ success: true, data: mockSamples }));
      samplesServiceSpy.getProjectInfo.mockReturnValue(of({ success: true, data: mockProjectInfo }));

      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.samples).toEqual(mockSamples);
      expect(component.loading).toBe(false);
      expect(samplesServiceSpy.getSamples).toHaveBeenCalled();
    });

    it('should handle empty samples', async () => {
      samplesServiceSpy.getSamples.mockReturnValue(of({ success: true, data: [] }));
      samplesServiceSpy.getProjectInfo.mockReturnValue(of({ success: true, data: mockProjectInfo }));

      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.samples).toEqual([]);
      expect(component.loading).toBe(false);
    });

    it('should handle load error', async () => {
      samplesServiceSpy.getSamples.mockReturnValue(throwError(() => new Error('Network error')));
      samplesServiceSpy.getProjectInfo.mockReturnValue(of({ success: true, data: mockProjectInfo }));

      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.error).toBe('Hiba történt az adatok betöltésekor');
      expect(component.loading).toBe(false);
    });

    it('should load project info', async () => {
      samplesServiceSpy.getSamples.mockReturnValue(of({ success: true, data: mockSamples }));
      samplesServiceSpy.getProjectInfo.mockReturnValue(of({ success: true, data: mockProjectInfo }));

      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.projectInfo).toEqual(mockProjectInfo);
    });
  });

  // ===========================================
  // LIGHTBOX TESTS
  // ===========================================

  describe('Lightbox', () => {
    beforeEach(async () => {
      samplesServiceSpy.getSamples.mockReturnValue(of({ success: true, data: mockSamples }));
      samplesServiceSpy.getProjectInfo.mockReturnValue(of({ success: true, data: mockProjectInfo }));
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should open lightbox with selected index', () => {
      component.openLightbox(0);

      expect(component.selectedIndex).toBe(0);
    });

    it('should close lightbox', () => {
      component.openLightbox(0);
      component.closeLightbox();

      expect(component.selectedIndex).toBeNull();
    });

    it('should navigate to new index', () => {
      component.openLightbox(0);
      component.onNavigate(1);

      expect(component.selectedIndex).toBe(1);
    });
  });

  // ===========================================
  // LIGHTBOX SAMPLES CONVERSION TESTS
  // ===========================================

  describe('Lightbox Samples Conversion', () => {
    beforeEach(async () => {
      samplesServiceSpy.getSamples.mockReturnValue(of({ success: true, data: mockSamples }));
      samplesServiceSpy.getProjectInfo.mockReturnValue(of({ success: true, data: mockProjectInfo }));
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should convert samples to lightbox format', () => {
      const lightboxSamples = component.lightboxSamples;

      expect(lightboxSamples.length).toBe(3);
      expect(lightboxSamples[0]).toEqual({
        id: 1,
        url: 'https://example.com/sample1.jpg',
        thumbUrl: 'https://example.com/thumb1.jpg',
        fileName: 'sample1.jpg',
        createdAt: '2026-01-01T10:00:00Z',
        description: '<p>Első minta</p>'
      });
    });

    it('should handle null description', () => {
      const lightboxSamples = component.lightboxSamples;

      expect(lightboxSamples[1].description).toBeUndefined();
    });
  });

  // ===========================================
  // RELATIVE TIME TESTS
  // ===========================================

  describe('Relative Time Formatting', () => {
    beforeEach(async () => {
      samplesServiceSpy.getSamples.mockReturnValue(of({ success: true, data: mockSamples }));
      samplesServiceSpy.getProjectInfo.mockReturnValue(of({ success: true, data: mockProjectInfo }));
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should format recent time as "Most"', () => {
      const now = new Date();
      const result = component.getRelativeTime(now.toISOString());
      expect(result).toBe('Most');
    });

    it('should format minutes ago', () => {
      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
      const result = component.getRelativeTime(thirtyMinsAgo.toISOString());
      expect(result).toBe('30 perce');
    });

    it('should format hours ago', () => {
      const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
      const result = component.getRelativeTime(fiveHoursAgo.toISOString());
      expect(result).toBe('5 órája');
    });

    it('should format days ago', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const result = component.getRelativeTime(threeDaysAgo.toISOString());
      expect(result).toBe('3 napja');
    });

    it('should format months ago', () => {
      const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      const result = component.getRelativeTime(twoMonthsAgo.toISOString());
      expect(result).toBe('2 hónapja');
    });
  });

  // ===========================================
  // TRACKBY TESTS
  // ===========================================

  describe('TrackBy Function', () => {
    it('should return sample id for tracking', () => {
      const sample: Sample = {
        id: 42,
        fileName: 'test.jpg',
        url: 'https://example.com/test.jpg',
        thumbUrl: 'https://example.com/thumb.jpg',
        description: null,
        createdAt: '2026-01-01T10:00:00Z'
      };

      const result = component.trackBySample(0, sample);
      expect(result).toBe(42);
    });
  });

  // ===========================================
  // CLEANUP TESTS
  // ===========================================

  describe('Cleanup', () => {
    beforeEach(async () => {
      samplesServiceSpy.getSamples.mockReturnValue(of({ success: true, data: mockSamples }));
      samplesServiceSpy.getProjectInfo.mockReturnValue(of({ success: true, data: mockProjectInfo }));
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should cleanup on destroy without throwing', () => {
      component.openLightbox(0);

      // Should not throw on destroy
      expect(() => fixture.destroy()).not.toThrow();
    });
  });
});
