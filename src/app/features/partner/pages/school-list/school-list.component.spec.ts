import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PartnerSchoolListComponent } from './school-list.component';
import { PartnerService } from '../../services/partner.service';
import { PartnerSchoolService } from '../../services/partner-school.service';
import { Router } from '@angular/router';
import { ToastService } from '../../../../core/services/toast.service';
import { GuidedTourService } from '../../../../core/services/guided-tour.service';
import { of } from 'rxjs';

describe('PartnerSchoolListComponent', () => {
  let component: PartnerSchoolListComponent;
  let fixture: ComponentFixture<PartnerSchoolListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartnerSchoolListComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: () => null } } } },
        { provide: PartnerService, useValue: {} },
        { provide: PartnerSchoolService, useValue: {} },
        { provide: Router, useValue: { navigate: vi.fn(), events: of(), url: '/' } },
        { provide: ToastService, useValue: {} },
        { provide: GuidedTourService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PartnerSchoolListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
