import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { EmailTemplateListComponent } from './email-template-list.component';
import { PartnerEmailTemplateService } from '../../../services/partner-email-template.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('EmailTemplateListComponent', () => {
  let component: EmailTemplateListComponent;
  let fixture: ComponentFixture<EmailTemplateListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailTemplateListComponent],
      providers: [
        { provide: PartnerEmailTemplateService, useValue: { getTemplates: vi.fn().mockReturnValue(of([])) } },
        { provide: Router, useValue: { navigate: vi.fn(), events: of(), url: '/' } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(EmailTemplateListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
