import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PartnerSchoolDetailComponent } from './school-detail.component';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { PartnerSchoolService } from '../../services/partner-school.service';
import { of } from 'rxjs';

describe('PartnerSchoolDetailComponent', () => {
  let component: PartnerSchoolDetailComponent;
  let fixture: ComponentFixture<PartnerSchoolDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartnerSchoolDetailComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: vi.fn() } } } },
        { provide: Router, useValue: { navigate: vi.fn(), events: of(), url: '/' } },
        { provide: PartnerSchoolService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PartnerSchoolDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
