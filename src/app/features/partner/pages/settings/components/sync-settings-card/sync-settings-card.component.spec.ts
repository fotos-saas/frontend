import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SyncSettingsCardComponent } from './sync-settings-card.component';
import { ElectronSyncService } from '../../../../../../core/services/electron-sync.service';
import { ElectronService } from '../../../../../../core/services/electron.service';
import { AuthService } from '../../../../../../core/services/auth.service';

describe('SyncSettingsCardComponent', () => {
  let component: SyncSettingsCardComponent;
  let fixture: ComponentFixture<SyncSettingsCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SyncSettingsCardComponent],
      providers: [
        { provide: ElectronSyncService, useValue: {} },
        { provide: ElectronService, useValue: {} },
        { provide: AuthService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SyncSettingsCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
