import { TestBed } from '@angular/core/testing';
import { PhotoSelectionBadgeService } from './photo-selection-badge.service';
import { AuthService } from './auth.service';
import { BehaviorSubject } from 'rxjs';

describe('PhotoSelectionBadgeService', () => {
  let service: PhotoSelectionBadgeService;
  const project$ = new BehaviorSubject<any>(null);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { project$: project$.asObservable() } },
      ],
    });
    service = TestBed.inject(PhotoSelectionBadgeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('shouldShowBadge', () => {
    it('false ha nincs projekt', () => {
      project$.next(null);
      expect(service.shouldShowBadge()).toBe(false);
    });

    it('false ha nincs galéria', () => {
      project$.next({ hasGallery: false, photoSelectionFinalized: false });
      expect(service.shouldShowBadge()).toBe(false);
    });

    it('false ha véglegesítve van', () => {
      project$.next({ hasGallery: true, photoSelectionFinalized: true });
      expect(service.shouldShowBadge()).toBe(false);
    });

    it('true ha van galéria és nincs véglegesítve', () => {
      project$.next({ hasGallery: true, photoSelectionFinalized: false });
      expect(service.shouldShowBadge()).toBe(true);
    });
  });

  describe('badgeText', () => {
    it('null ha nem kell badge', () => {
      project$.next(null);
      expect(service.badgeText()).toBeNull();
    });

    it('"!" ha kell badge', () => {
      project$.next({ hasGallery: true, photoSelectionFinalized: false });
      expect(service.badgeText()).toBe('!');
    });
  });
});
