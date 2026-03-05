import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { EmailAccountSettingsComponent } from './email-account-settings.component';
import { PartnerEmailAccountService } from '../../../services/partner-email-account.service';

describe('EmailAccountSettingsComponent', () => {
  let component: EmailAccountSettingsComponent;
  let fixture: ComponentFixture<EmailAccountSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailAccountSettingsComponent],
      providers: [
        { provide: PartnerEmailAccountService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(EmailAccountSettingsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
