import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SyncStatusIndicatorComponent } from './sync-status-indicator.component';
import { ElectronSyncService } from '../../../core/services/electron-sync.service';
import { ElectronService } from '../../../core/services/electron.service';

describe('SyncStatusIndicatorComponent', () => {
  let component: SyncStatusIndicatorComponent;
  let fixture: ComponentFixture<SyncStatusIndicatorComponent>;

  beforeEach(async () => {
    const mockElectronSyncService = {
      syncEnabled: vi.fn().mockReturnValue(false),
      isSyncing: vi.fn().mockReturnValue(false),
      syncState: vi.fn().mockReturnValue('disabled'),
      currentTransfer: vi.fn().mockReturnValue(null),
    };
    const mockElectronService = {
      isElectron: false,
    };

    await TestBed.configureTestingModule({
      imports: [SyncStatusIndicatorComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: ElectronSyncService, useValue: mockElectronSyncService },
        { provide: ElectronService, useValue: mockElectronService }
      ],
    })
    .overrideComponent(SyncStatusIndicatorComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(SyncStatusIndicatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute iconName', () => {
    expect(component.iconName()).toBeDefined();
  });

  it('should compute stateClass', () => {
    expect(component.stateClass()).toContain('sync-indicator');
  });

  it('should compute tooltipText', () => {
    expect(component.tooltipText()).toBeDefined();
  });
});
