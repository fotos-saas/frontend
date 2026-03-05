import { describe, it, expect, vi } from 'vitest';
import { saveFile } from './file.util';

describe('file.util', () => {

  describe('saveFile', () => {
    it('blob-ot ment fájlként', () => {
      // Mock URL API
      const mockUrl = 'blob:http://localhost/test';
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockUrl);
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      // Mock link element
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as never);

      const blob = new Blob(['teszt'], { type: 'text/plain' });
      saveFile(blob, 'teszt.txt');

      expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
      expect(mockLink.href).toBe(mockUrl);
      expect(mockLink.download).toBe('teszt.txt');
      expect(mockLink.click).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith(mockUrl);

      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });
  });
});
