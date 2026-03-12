import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { NgZone } from '@angular/core';
import { OverlayPhotoshopService } from './overlay-photoshop.service';
import { LoggerService } from '../../core/services/logger.service';

describe('OverlayPhotoshopService', () => {
  let service: OverlayPhotoshopService;
  let loggerMock: { debug: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn>; info: ReturnType<typeof vi.fn>; warn: ReturnType<typeof vi.fn> };

  const mockRunJsx = vi.fn();

  beforeEach(() => {
    loggerMock = {
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    };

    // Electron API mock
    (window as any).electronAPI = {
      photoshop: {
        runJsx: mockRunJsx,
      },
    };

    TestBed.configureTestingModule({
      providers: [
        OverlayPhotoshopService,
        { provide: LoggerService, useValue: loggerMock },
      ],
    });
    service = TestBed.inject(OverlayPhotoshopService);
  });

  afterEach(() => {
    delete (window as any).electronAPI;
    vi.restoreAllMocks();
  });

  // ============================================================================
  // Kezdeti állapot
  // ============================================================================
  describe('kezdeti állapot', () => {
    it('busyCommand null-al indul', () => {
      expect(service.busyCommand()).toBeNull();
    });
  });

  // ============================================================================
  // runJsx
  // ============================================================================
  describe('runJsx', () => {
    it('busy state-et beállítja, majd visszaállítja', async () => {
      mockRunJsx.mockResolvedValue({ success: true, output: '{}' });

      const promise = service.runJsx('test-cmd', 'actions/test.jsx');
      expect(service.busyCommand()).toBe('test-cmd');

      await promise;
      expect(service.busyCommand()).toBeNull();
    });

    it('eredményt adja vissza sikeres futásnál', async () => {
      const mockResult = { success: true, output: '{"data": 42}' };
      mockRunJsx.mockResolvedValue(mockResult);

      const result = await service.runJsx('cmd', 'actions/test.jsx');
      expect(result).toEqual(mockResult);
    });

    it('jsonData-t továbbítja a runJsx hívásnak', async () => {
      mockRunJsx.mockResolvedValue({ success: true });
      const jsonData = { key: 'value', num: 42 };

      await service.runJsx('cmd', 'actions/test.jsx', jsonData);
      expect(mockRunJsx).toHaveBeenCalledWith({ scriptName: 'actions/test.jsx', jsonData });
    });

    it('pollCallback-et meghívja sikeres futás után', async () => {
      mockRunJsx.mockResolvedValue({ success: true });
      const pollCb = vi.fn();

      await service.runJsx('cmd', 'actions/test.jsx', undefined, pollCb);
      expect(pollCb).toHaveBeenCalledOnce();
    });

    it('hiba esetén null-t ad vissza és logol', async () => {
      const error = new Error('JSX error');
      mockRunJsx.mockRejectedValue(error);

      const result = await service.runJsx('fail-cmd', 'actions/test.jsx');
      expect(result).toBeNull();
      expect(loggerMock.error).toHaveBeenCalledWith('[JSX:fail-cmd] error:', error);
    });

    it('hiba után is reseteli a busyCommand-ot', async () => {
      mockRunJsx.mockRejectedValue(new Error('error'));

      await service.runJsx('fail-cmd', 'actions/test.jsx');
      expect(service.busyCommand()).toBeNull();
    });

    it('null-t ad vissza ha nincs electronAPI', async () => {
      delete (window as any).electronAPI;

      const result = await service.runJsx('cmd', 'actions/test.jsx');
      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // withBusy
  // ============================================================================
  describe('withBusy', () => {
    it('busy state-et beállítja művelet közben', async () => {
      let busyDuringOp: string | null = null;
      const op = async () => {
        busyDuringOp = service.busyCommand();
        return 'result';
      };

      const result = await service.withBusy('busy-cmd', op);
      expect(busyDuringOp).toBe('busy-cmd');
      expect(result).toBe('result');
      expect(service.busyCommand()).toBeNull();
    });

    it('hiba esetén is reseteli a busy state-et', async () => {
      const op = async () => { throw new Error('fail'); };

      await expect(service.withBusy('fail-cmd', op)).rejects.toThrow('fail');
      expect(service.busyCommand()).toBeNull();
    });
  });

  // ============================================================================
  // getImageLayerNames
  // ============================================================================
  describe('getImageLayerNames', () => {
    it('neveket adja vissza sikeres PS hívás esetén', async () => {
      mockRunJsx.mockResolvedValue({
        success: true,
        output: JSON.stringify({ names: ['layer-a', 'layer-b'], students: ['layer-a'], teachers: ['layer-b'] }),
      });

      const names = await service.getImageLayerNames();
      expect(names).toEqual(['layer-a', 'layer-b']);
    });

    it('üres tömböt ad vissza ha nincs electronAPI', async () => {
      delete (window as any).electronAPI;
      const names = await service.getImageLayerNames();
      expect(names).toEqual([]);
    });
  });

  // ============================================================================
  // getImageLayerData
  // ============================================================================
  describe('getImageLayerData', () => {
    it('neveket és csoportokat adja vissza', async () => {
      mockRunJsx.mockResolvedValue({
        success: true,
        output: JSON.stringify({
          names: ['a', 'b', 'c'],
          students: ['a', 'b'],
          teachers: ['c'],
        }),
      });

      const data = await service.getImageLayerData();
      expect(data.names).toEqual(['a', 'b', 'c']);
      expect(data.students).toEqual(['a', 'b']);
      expect(data.teachers).toEqual(['c']);
    });

    it('üres objektumot ad vissza ha result.success === false', async () => {
      mockRunJsx.mockResolvedValue({ success: false });
      const data = await service.getImageLayerData();
      expect(data).toEqual({ names: [], students: [], teachers: [] });
    });

    it('üres objektumot ad vissza ha output nem JSON', async () => {
      mockRunJsx.mockResolvedValue({ success: true, output: 'not json' });
      const data = await service.getImageLayerData();
      expect(data).toEqual({ names: [], students: [], teachers: [] });
    });

    it('üres objektumot ad vissza ha nincs electronAPI', async () => {
      delete (window as any).electronAPI;
      const data = await service.getImageLayerData();
      expect(data).toEqual({ names: [], students: [], teachers: [] });
    });
  });

  // ============================================================================
  // getNamesTextContent
  // ============================================================================
  describe('getNamesTextContent', () => {
    it('Map-et ad vissza layer nevekkel és szöveggel', async () => {
      mockRunJsx.mockResolvedValue({
        success: true,
        output: JSON.stringify({
          items: [
            { layerName: 'kiss-janos---1', textContent: 'Kiss János' },
            { layerName: 'nagy-anna---2', textContent: 'Nagy Anna' },
          ],
        }),
      });

      const map = await service.getNamesTextContent();
      expect(map.size).toBe(2);
      expect(map.get('kiss-janos---1')).toBe('Kiss János');
      expect(map.get('nagy-anna---2')).toBe('Nagy Anna');
    });

    it('üres szöveget kihagyja', async () => {
      mockRunJsx.mockResolvedValue({
        success: true,
        output: JSON.stringify({ items: [{ layerName: 'empty', textContent: '' }] }),
      });

      const map = await service.getNamesTextContent();
      expect(map.size).toBe(0);
    });

    it('newline-okat szóközre cseréli', async () => {
      mockRunJsx.mockResolvedValue({
        success: true,
        output: JSON.stringify({ items: [{ layerName: 'test', textContent: 'Első\nMásodik\rHarmadik' }] }),
      });

      const map = await service.getNamesTextContent();
      expect(map.get('test')).toBe('Első Második Harmadik');
    });

    it('üres map-et ad vissza ha nincs electronAPI', async () => {
      delete (window as any).electronAPI;
      const map = await service.getNamesTextContent();
      expect(map.size).toBe(0);
    });
  });

  // ============================================================================
  // getPositionsTextContent
  // ============================================================================
  describe('getPositionsTextContent', () => {
    it('Map-et ad vissza pozíció szövegekkel', async () => {
      mockRunJsx.mockResolvedValue({
        success: true,
        output: JSON.stringify({
          items: [{ layerName: 'igazgato---1', textContent: 'igazgató' }],
        }),
      });

      const map = await service.getPositionsTextContent();
      expect(map.get('igazgato---1')).toBe('igazgató');
    });

    it('üres map-et ad vissza ha result.success === false', async () => {
      mockRunJsx.mockResolvedValue({ success: false });
      const map = await service.getPositionsTextContent();
      expect(map.size).toBe(0);
    });
  });

  // ============================================================================
  // getImageLayerPositions
  // ============================================================================
  describe('getImageLayerPositions', () => {
    it('pozíciókat adja vissza', async () => {
      mockRunJsx.mockResolvedValue({
        success: true,
        output: JSON.stringify({
          students: [{ name: 'a', x: 10, y: 20 }],
          teachers: [{ name: 'b', x: 30, y: 40 }],
        }),
      });

      const positions = await service.getImageLayerPositions();
      expect(positions.students).toEqual([{ name: 'a', x: 10, y: 20 }]);
      expect(positions.teachers).toEqual([{ name: 'b', x: 30, y: 40 }]);
    });

    it('üres tömböket ad vissza ha nincs electronAPI', async () => {
      delete (window as any).electronAPI;
      const positions = await service.getImageLayerPositions();
      expect(positions).toEqual({ students: [], teachers: [] });
    });
  });

  // ============================================================================
  // getImageDataCombined
  // ============================================================================
  describe('getImageDataCombined', () => {
    it('kombinált adatokat adja vissza', async () => {
      mockRunJsx.mockResolvedValue({
        success: true,
        output: JSON.stringify({
          names: ['a', 'b'],
          studentNames: ['a'],
          teacherNames: ['b'],
          students: [{ name: 'a', x: 1, y: 2 }],
          teachers: [{ name: 'b', x: 3, y: 4 }],
        }),
      });

      const data = await service.getImageDataCombined();
      expect(data.names).toEqual(['a', 'b']);
      expect(data.studentNames).toEqual(['a']);
      expect(data.teacherNames).toEqual(['b']);
    });

    it('üres struktúrát ad vissza ha nem JSON output', async () => {
      mockRunJsx.mockResolvedValue({ success: true, output: 'invalid' });
      const data = await service.getImageDataCombined();
      expect(data).toEqual({ names: [], studentNames: [], teacherNames: [], students: [], teachers: [] });
    });

    it('üres struktúrát ad vissza hiba esetén', async () => {
      mockRunJsx.mockRejectedValue(new Error('fail'));
      const data = await service.getImageDataCombined();
      expect(data).toEqual({ names: [], studentNames: [], teacherNames: [], students: [], teachers: [] });
    });
  });

  // ============================================================================
  // getFreshSelectedLayerNames
  // ============================================================================
  describe('getFreshSelectedLayerNames', () => {
    it('kijelölt layer neveket adja vissza', async () => {
      mockRunJsx.mockResolvedValue({
        success: true,
        output: JSON.stringify({ selectedLayerNames: ['layer-1', 'layer-2'], selectedLayers: 2 }),
      });

      const result = await service.getFreshSelectedLayerNames();
      expect(result.names).toEqual(['layer-1', 'layer-2']);
      expect(result.doc).toBeTruthy();
    });

    it('üres tömböt ad vissza ha nincs electronAPI', async () => {
      delete (window as any).electronAPI;
      const result = await service.getFreshSelectedLayerNames();
      expect(result.names).toEqual([]);
      expect(result.doc).toBeNull();
    });

    it('üres tömböt ad vissza ha success === false', async () => {
      mockRunJsx.mockResolvedValue({ success: false });
      const result = await service.getFreshSelectedLayerNames();
      expect(result.names).toEqual([]);
      expect(result.doc).toBeNull();
    });
  });

  // ============================================================================
  // getSortableNames
  // ============================================================================
  describe('getSortableNames', () => {
    it('kijelölt layer neveket adja vissza ha >= 2', async () => {
      mockRunJsx.mockResolvedValueOnce({
        success: true,
        output: JSON.stringify({ selectedLayerNames: ['a', 'b', 'c'], selectedLayers: 3 }),
      });

      const names = await service.getSortableNames();
      expect(names).toEqual(['a', 'b', 'c']);
    });

    it('ha kevesebb mint 2 kijelölt, az összes image layer nevet adja', async () => {
      // Első hívás: getFreshSelectedLayerNames - kevés layer
      mockRunJsx.mockResolvedValueOnce({
        success: true,
        output: JSON.stringify({ selectedLayerNames: ['only-one'], selectedLayers: 1 }),
      });
      // Második hívás: getImageLayerNames
      mockRunJsx.mockResolvedValueOnce({
        success: true,
        output: JSON.stringify({ names: ['all-1', 'all-2', 'all-3'], students: [], teachers: [] }),
      });

      const names = await service.getSortableNames();
      expect(names).toEqual(['all-1', 'all-2', 'all-3']);
    });
  });
});
