import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PartnerStudentListComponent } from './student-list.component';
import { PartnerStudentService } from '../../services/partner-student.service';
import { PartnerSchoolService } from '../../services/partner-school.service';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('PartnerStudentListComponent', () => {
  let component: PartnerStudentListComponent;
  let fixture: ComponentFixture<PartnerStudentListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartnerStudentListComponent],
      providers: [
        { provide: PartnerStudentService, useValue: {} },
        { provide: PartnerSchoolService, useValue: {} },
        { provide: Router, useValue: { navigate: vi.fn(), events: of(), url: '/' } },
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: vi.fn() } } } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PartnerStudentListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
