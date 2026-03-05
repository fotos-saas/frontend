import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PartnerContactListComponent } from './contact-list.component';
import { PartnerService } from '../../services/partner.service';
import { Router } from '@angular/router';
import { ClipboardService } from '../../../../core/services/clipboard.service';
import { FeatureToggleService } from '../../../../core/services/feature-toggle.service';

describe('PartnerContactListComponent', () => {
  let component: PartnerContactListComponent;
  let fixture: ComponentFixture<PartnerContactListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartnerContactListComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: () => null } } } },
        { provide: PartnerService, useValue: {} },
        { provide: Router, useValue: { navigate: vi.fn(), events: of(), url: '/' } },
        { provide: ClipboardService, useValue: {} },
        { provide: FeatureToggleService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PartnerContactListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
