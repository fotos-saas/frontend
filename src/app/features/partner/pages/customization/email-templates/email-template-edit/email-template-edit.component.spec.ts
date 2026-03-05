import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { EmailTemplateEditComponent } from './email-template-edit.component';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { PartnerEmailTemplateService } from '../../../../services/partner-email-template.service';
import { DomSanitizer } from '@angular/platform-browser';
import { of } from 'rxjs';

describe('EmailTemplateEditComponent', () => {
  let component: EmailTemplateEditComponent;
  let fixture: ComponentFixture<EmailTemplateEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailTemplateEditComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: vi.fn() } } } },
        { provide: Router, useValue: { navigate: vi.fn(), events: of(), url: '/' } },
        { provide: PartnerEmailTemplateService, useValue: { getTemplate: vi.fn().mockReturnValue(of({ data: { name: 'test', subject: '', body: '' } })), getVariables: vi.fn().mockReturnValue(of([])), saveTemplate: vi.fn().mockReturnValue(of({})) } },
        { provide: DomSanitizer, useValue: { bypassSecurityTrustHtml: vi.fn((v: string) => v) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(EmailTemplateEditComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
