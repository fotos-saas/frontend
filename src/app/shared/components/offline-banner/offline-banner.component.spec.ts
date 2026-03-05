import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { OfflineBannerComponent } from './offline-banner.component';
import { OfflineService } from '../../../core/services/offline.service';

describe('OfflineBannerComponent', () => {
  let component: OfflineBannerComponent;
  let fixture: ComponentFixture<OfflineBannerComponent>;

  beforeEach(async () => {
    const mockOfflineService = {
      isOffline: vi.fn().mockReturnValue(null),
      isSyncing: vi.fn().mockReturnValue(null),
      pendingRequests: vi.fn().mockReturnValue(null),
      lastSync: vi.fn().mockReturnValue(null),
      processQueue: vi.fn().mockReturnValue(null)
    };

    await TestBed.configureTestingModule({
      imports: [OfflineBannerComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: OfflineService, useValue: mockOfflineService }
      ],
    })
    .overrideComponent(OfflineBannerComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(OfflineBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
