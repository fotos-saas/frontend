import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DestroyRef } from '@angular/core';
import { LightboxService } from './lightbox.service';
import { PostMedia } from './forum.service';

/**
 * LightboxService unit tesztek
 *
 * Lightbox állapot kezelés, navigáció, body scroll lock.
 */
describe('LightboxService', () => {
  let service: LightboxService;

  const mockMedia: PostMedia[] = [
    { id: 1, url: '/img/1.jpg', fileName: 'photo1.jpg', isImage: true },
    { id: 2, url: '/img/2.jpg', fileName: 'photo2.jpg', isImage: true },
    { id: 3, url: '/doc/1.pdf', fileName: 'doc.pdf', isImage: false },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LightboxService],
    });
    service = TestBed.inject(LightboxService);
    // Reset body overflow
    document.body.style.overflow = '';
  });

  afterEach(() => {
    // Cleanup
    if (service.isOpen()) {
      service.close();
    }
    document.body.style.overflow = '';
  });

  describe('alapállapot', () => {
    it('zárt és üres', () => {
      expect(service.isOpen()).toBe(false);
      expect(service.media()).toEqual([]);
      expect(service.currentIndex()).toBe(0);
    });
  });

  describe('open', () => {
    it('megnyitja a lightbox-ot a megadott médiával', () => {
      service.open(mockMedia);

      expect(service.isOpen()).toBe(true);
      expect(service.media()).toEqual(mockMedia);
      expect(service.currentIndex()).toBe(0);
    });

    it('megnyitja a lightbox-ot adott kezdő index-szel', () => {
      service.open(mockMedia, 2);
      expect(service.currentIndex()).toBe(2);
    });

    it('zárolj a body scroll-t', () => {
      document.body.style.overflow = 'auto';
      service.open(mockMedia);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('megőrzi az eredeti overflow értéket', () => {
      document.body.style.overflow = 'scroll';
      service.open(mockMedia);
      service.close();
      expect(document.body.style.overflow).toBe('scroll');
    });
  });

  describe('close', () => {
    it('bezárja a lightbox-ot', () => {
      service.open(mockMedia);
      service.close();

      expect(service.isOpen()).toBe(false);
    });

    it('feloldja a body scroll zárolást', () => {
      document.body.style.overflow = '';
      service.open(mockMedia);
      service.close();
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('navigateTo', () => {
    beforeEach(() => {
      service.open(mockMedia);
    });

    it('az adott indexre navigál', () => {
      service.navigateTo(1);
      expect(service.currentIndex()).toBe(1);
    });

    it('nem navigál érvénytelen negatív indexre', () => {
      service.navigateTo(-1);
      expect(service.currentIndex()).toBe(0);
    });

    it('nem navigál a média lista végén túlra', () => {
      service.navigateTo(5);
      expect(service.currentIndex()).toBe(0);
    });

    it('az utolsó érvényes indexre navigálhat', () => {
      service.navigateTo(2);
      expect(service.currentIndex()).toBe(2);
    });
  });

  describe('previous', () => {
    beforeEach(() => {
      service.open(mockMedia, 1);
    });

    it('az előző elemre navigál', () => {
      service.previous();
      expect(service.currentIndex()).toBe(0);
    });

    it('az elejéről az utolsó elemre ugrik (körbe navigálás)', () => {
      service.navigateTo(0);
      service.previous();
      expect(service.currentIndex()).toBe(2);
    });
  });

  describe('next', () => {
    beforeEach(() => {
      service.open(mockMedia, 1);
    });

    it('a következő elemre navigál', () => {
      service.next();
      expect(service.currentIndex()).toBe(2);
    });

    it('az utolsóról az első elemre ugrik (körbe navigálás)', () => {
      service.navigateTo(2);
      service.next();
      expect(service.currentIndex()).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('bezárja a lightbox-ot ha nyitva van', () => {
      service.open(mockMedia);
      service.cleanup();
      expect(service.isOpen()).toBe(false);
    });

    it('nem csinál semmit ha zárt', () => {
      expect(() => service.cleanup()).not.toThrow();
      expect(service.isOpen()).toBe(false);
    });
  });

  describe('registerCleanup', () => {
    it('regisztrálja a destroy callback-et', () => {
      let destroyCallback: (() => void) | null = null;
      const mockDestroyRef: DestroyRef = {
        onDestroy: (cb: () => void) => {
          destroyCallback = cb;
        },
      } as DestroyRef;

      service.open(mockMedia);
      service.registerCleanup(mockDestroyRef);

      // Szimuláljuk a komponens destroy-ját
      destroyCallback!();
      expect(service.isOpen()).toBe(false);
    });
  });

  describe('edge case-ek', () => {
    it('üres média lista kezelése', () => {
      service.open([]);
      expect(service.isOpen()).toBe(true);
      expect(service.media()).toEqual([]);
    });

    it('1 elemű lista navigáció', () => {
      service.open([mockMedia[0]]);
      service.next();
      expect(service.currentIndex()).toBe(0); // Körbe navigálás
      service.previous();
      expect(service.currentIndex()).toBe(0); // Körbe navigálás
    });
  });
});
