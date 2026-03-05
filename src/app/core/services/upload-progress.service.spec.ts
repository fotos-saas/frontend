import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { UploadProgressService } from './upload-progress.service';
import { firstValueFrom, toArray } from 'rxjs';

describe('UploadProgressService', () => {
  let service: UploadProgressService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(UploadProgressService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('uploadFilesWithProgress', () => {
    it('üres files tömb esetén completed state-et ad', async () => {
      const result = await firstValueFrom(service.uploadFilesWithProgress('/api/upload', []));
      expect(result.phase).toBe('completed');
      expect(result.completed).toBe(true);
      expect(result.overallProgress).toBe(100);
    });

    it('fájlokat feltölti és progress-t ad', async () => {
      const files = [new File(['a'], 'a.jpg')];
      const states: any[] = [];

      const promise = new Promise<void>((resolve) => {
        service.uploadFilesWithProgress('/api/upload', files).subscribe({
          next: (state) => states.push(state),
          complete: () => resolve(),
        });
      });

      const req = httpMock.expectOne('/api/upload');
      req.flush({ uploadedCount: 1, photos: [] });

      await promise;
      const last = states[states.length - 1];
      expect(last.completed).toBe(true);
      expect(last.phase).toBe('completed');
    });
  });
});
