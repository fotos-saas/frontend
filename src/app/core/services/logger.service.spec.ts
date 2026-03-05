import { TestBed } from '@angular/core/testing';
import { LoggerService } from './logger.service';

/**
 * LoggerService unit tesztek
 *
 * Environment-aware logging: development-ben logol, production-ben nem.
 */
describe('LoggerService', () => {
  let service: LoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoggerService],
    });
    service = TestBed.inject(LoggerService);

    // Spy-ok a console metódusokra
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'group').mockImplementation(() => {});
    vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('development mód (isProduction = false)', () => {
    beforeEach(() => {
      // A service a test environment-ből olvassa: production = false
      // Tehát development módban vagyunk
    });

    it('info() meghívja a console.info-t a helyes prefix-szel', () => {
      service.info('Teszt üzenet', { data: 123 });
      expect(console.info).toHaveBeenCalledWith('[INFO] Teszt üzenet', { data: 123 });
    });

    it('warn() meghívja a console.warn-t', () => {
      service.warn('Figyelmeztetés');
      expect(console.warn).toHaveBeenCalledWith('[WARN] Figyelmeztetés');
    });

    it('error() meghívja a console.error-t', () => {
      const err = new Error('Hiba');
      service.error('Valami hiba', err);
      expect(console.error).toHaveBeenCalledWith('[ERROR] Valami hiba', err);
    });

    it('error() működik error paraméter nélkül is', () => {
      service.error('Egyszerű hiba');
      expect(console.error).toHaveBeenCalledWith('[ERROR] Egyszerű hiba', undefined);
    });

    it('debug() meghívja a console.debug-ot', () => {
      service.debug('Debug info', 'adat1', 'adat2');
      expect(console.debug).toHaveBeenCalledWith('[DEBUG] Debug info', 'adat1', 'adat2');
    });

    it('group() meghívja a console.group-ot', () => {
      service.group('Csoport');
      expect(console.group).toHaveBeenCalledWith('Csoport');
    });

    it('groupEnd() meghívja a console.groupEnd-et', () => {
      service.groupEnd();
      expect(console.groupEnd).toHaveBeenCalled();
    });
  });

  describe('production mód (isProduction = true)', () => {
    let prodService: LoggerService;

    beforeEach(() => {
      // Közvetlenül módosítjuk a private isProduction property-t
      prodService = TestBed.inject(LoggerService);
      (prodService as unknown as { isProduction: boolean }).isProduction = true;
    });

    it('info() NEM hívja meg a console.info-t', () => {
      prodService.info('Teszt üzenet');
      expect(console.info).not.toHaveBeenCalled();
    });

    it('warn() NEM hívja meg a console.warn-t', () => {
      prodService.warn('Figyelmeztetés');
      expect(console.warn).not.toHaveBeenCalled();
    });

    it('error() NEM hívja meg a console.error-t', () => {
      prodService.error('Hiba', new Error());
      expect(console.error).not.toHaveBeenCalled();
    });

    it('debug() NEM hívja meg a console.debug-ot', () => {
      prodService.debug('Debug');
      expect(console.debug).not.toHaveBeenCalled();
    });

    it('group() NEM hívja meg a console.group-ot', () => {
      prodService.group('Csoport');
      expect(console.group).not.toHaveBeenCalled();
    });

    it('groupEnd() NEM hívja meg a console.groupEnd-et', () => {
      prodService.groupEnd();
      expect(console.groupEnd).not.toHaveBeenCalled();
    });
  });

  describe('többszörös adatparaméterek', () => {
    it('info() több spread paramétert is továbbít', () => {
      service.info('msg', 1, 'two', { three: 3 });
      expect(console.info).toHaveBeenCalledWith('[INFO] msg', 1, 'two', { three: 3 });
    });

    it('debug() több spread paramétert is továbbít', () => {
      service.debug('msg', [1, 2], null);
      expect(console.debug).toHaveBeenCalledWith('[DEBUG] msg', [1, 2], null);
    });
  });
});
