import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { GlobalSettingsComponent } from './global-settings.component';
import { PartnerService } from '../../services/partner.service';
import { ToastService } from '../../../../core/services/toast.service';
import { FeatureToggleService } from '../../../../core/services/feature-toggle.service';

describe('GlobalSettingsComponent', () => {
  let component: GlobalSettingsComponent;
  let fixture: ComponentFixture<GlobalSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlobalSettingsComponent],
      providers: [
        { provide: PartnerService, useValue: {} },
        { provide: ToastService, useValue: {} },
        { provide: FeatureToggleService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(GlobalSettingsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
