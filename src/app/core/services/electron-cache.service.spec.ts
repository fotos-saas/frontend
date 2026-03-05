import { TestBed } from '@angular/core/testing';
import { ElectronCacheService } from './electron-cache.service';

describe('ElectronCacheService', () => {
  let service: ElectronCacheService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ElectronCacheService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('cacheSet / cacheGet (localStorage fallback)', () => {
    it('értéket ment és visszaolvas', async () => {
      await service.cacheSet('test_key', { data: 42 });
      const result = await service.cacheGet<{ data: number }>('test_key');
      expect(result).toEqual({ data: 42 });
    });

    it('TTL-lel ment', async () => {
      await service.cacheSet('ttl_key', 'value', 60000);
      const result = await service.cacheGet('ttl_key');
      expect(result).toBe('value');
    });

    it('lejárt TTL-nél null-t ad', async () => {
      // Manuálisan lejárt értéket mentünk
      localStorage.setItem('photostack_cache_expired', JSON.stringify({
        value: 'old', expiry: Date.now() - 1000,
      }));
      const result = await service.cacheGet('expired');
      expect(result).toBeNull();
    });

    it('nem létező kulcsra null-t ad', async () => {
      const result = await service.cacheGet('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('cacheDelete', () => {
    it('törli az értéket', async () => {
      await service.cacheSet('del_key', 'value');
      await service.cacheDelete('del_key');
      const result = await service.cacheGet('del_key');
      expect(result).toBeNull();
    });
  });

  describe('cacheClear', () => {
    it('összes photostack cache kulcsot törli', async () => {
      await service.cacheSet('key1', 'v1');
      await service.cacheSet('key2', 'v2');
      localStorage.setItem('other_key', 'should_stay');

      await service.cacheClear();

      expect(await service.cacheGet('key1')).toBeNull();
      expect(await service.cacheGet('key2')).toBeNull();
      expect(localStorage.getItem('other_key')).toBe('should_stay');
    });
  });

  describe('request queue (localStorage fallback)', () => {
    it('request-et hozzáad és listáz', async () => {
      const id = await service.queueRequest({
        method: 'POST', url: '/api/test', body: { data: 1 },
      });
      expect(id).toBeTruthy();

      const requests = await service.getQueuedRequests();
      expect(requests.length).toBe(1);
      expect(requests[0].url).toBe('/api/test');
    });

    it('request-et töröl', async () => {
      const id = await service.queueRequest({
        method: 'PUT', url: '/api/test', body: {},
      });
      await service.removeQueuedRequest(id!);
      const requests = await service.getQueuedRequests();
      expect(requests.length).toBe(0);
    });

    it('queue-t üríti', async () => {
      await service.queueRequest({ method: 'POST', url: '/test', body: {} });
      await service.clearRequestQueue();
      const requests = await service.getQueuedRequests();
      expect(requests.length).toBe(0);
    });
  });

  describe('sync status (localStorage fallback)', () => {
    it('last sync mentés és olvasás', async () => {
      const ts = Date.now();
      await service.setLastSync(ts);
      const result = await service.getLastSync();
      expect(result).toBe(ts);
    });

    it('null ha nincs last sync', async () => {
      const result = await service.getLastSync();
      expect(result).toBeNull();
    });
  });
});
