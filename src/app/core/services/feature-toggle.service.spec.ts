import { TestBed } from '@angular/core/testing';
import { FeatureToggleService } from './feature-toggle.service';

/**
 * FeatureToggleService unit tesztek
 *
 * Feature denylist kezelés, prefix egyezés tesztelése.
 */
describe('FeatureToggleService', () => {
  let service: FeatureToggleService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FeatureToggleService],
    });
    service = TestBed.inject(FeatureToggleService);
  });

  describe('alapállapot', () => {
    it('minden feature engedélyezett alapértelmezetten', () => {
      expect(service.isEnabled('sidebar.booking')).toBe(true);
      expect(service.isDisabled('sidebar.booking')).toBe(false);
    });
  });

  describe('setDisabledFeatures', () => {
    it('beállítja a letiltott feature-öket', () => {
      service.setDisabledFeatures(['sidebar.booking']);
      expect(service.isDisabled('sidebar.booking')).toBe(true);
      expect(service.isEnabled('sidebar.booking')).toBe(false);
    });

    it('felülírja a korábbi beállítást', () => {
      service.setDisabledFeatures(['feature.a']);
      service.setDisabledFeatures(['feature.b']);
      expect(service.isEnabled('feature.a')).toBe(true);
      expect(service.isDisabled('feature.b')).toBe(true);
    });
  });

  describe('isDisabled - prefix egyezés', () => {
    beforeEach(() => {
      service.setDisabledFeatures(['sidebar.booking']);
    });

    it('pontos egyezés letiltott', () => {
      expect(service.isDisabled('sidebar.booking')).toBe(true);
    });

    it('prefix egyezés: child feature is letiltott', () => {
      expect(service.isDisabled('sidebar.booking.calendar')).toBe(true);
    });

    it('child letiltása NEM tiltja a szülőt', () => {
      service.setDisabledFeatures(['sidebar.booking.calendar']);
      expect(service.isDisabled('sidebar.booking')).toBe(false);
      expect(service.isDisabled('sidebar.booking.calendar')).toBe(true);
    });

    it('nem tiltja le a hasonló nevű feature-t (nem prefix)', () => {
      expect(service.isDisabled('sidebar.bookings')).toBe(false);
    });

    it('nem letiltott feature engedélyezett', () => {
      expect(service.isEnabled('sidebar.photos')).toBe(true);
    });
  });

  describe('isEnabled', () => {
    it('isDisabled inverze', () => {
      service.setDisabledFeatures(['feature.x']);
      expect(service.isEnabled('feature.x')).toBe(false);
      expect(service.isEnabled('feature.y')).toBe(true);
    });
  });

  describe('több szabály', () => {
    it('több feature egyszerre letiltható', () => {
      service.setDisabledFeatures(['sidebar.booking', 'forum', 'voting.polls']);
      expect(service.isDisabled('sidebar.booking')).toBe(true);
      expect(service.isDisabled('sidebar.booking.calendar')).toBe(true);
      expect(service.isDisabled('forum')).toBe(true);
      expect(service.isDisabled('forum.posts')).toBe(true);
      expect(service.isDisabled('voting.polls')).toBe(true);
      expect(service.isDisabled('voting')).toBe(false);
    });

    it('üres tömb mindent engedélyez', () => {
      service.setDisabledFeatures(['sidebar.booking']);
      service.setDisabledFeatures([]);
      expect(service.isEnabled('sidebar.booking')).toBe(true);
    });
  });
});
