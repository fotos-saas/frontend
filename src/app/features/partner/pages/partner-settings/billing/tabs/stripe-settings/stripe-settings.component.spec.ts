import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { StripeSettingsComponent } from './stripe-settings.component';
import { PartnerStripeSettingsService } from '../../../../../services/partner-stripe-settings.service';

describe('StripeSettingsComponent', () => {
  let component: StripeSettingsComponent;
  let fixture: ComponentFixture<StripeSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StripeSettingsComponent],
      providers: [
        { provide: PartnerStripeSettingsService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(StripeSettingsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
