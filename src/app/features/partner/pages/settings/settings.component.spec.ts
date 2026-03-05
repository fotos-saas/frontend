import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PartnerSettingsComponent } from './settings.component';
import { SettingsStateService } from './settings-state.service';
import { ElectronService } from '../../../../core/services/electron.service';

describe('PartnerSettingsComponent', () => {
  let component: PartnerSettingsComponent;
  let fixture: ComponentFixture<PartnerSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartnerSettingsComponent],
      providers: [
        { provide: SettingsStateService, useValue: {} },
        { provide: ElectronService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PartnerSettingsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
