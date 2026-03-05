import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PartnerStudentDetailComponent } from './student-detail.component';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { PartnerStudentService } from '../../services/partner-student.service';
import { of } from 'rxjs';

describe('PartnerStudentDetailComponent', () => {
  let component: PartnerStudentDetailComponent;
  let fixture: ComponentFixture<PartnerStudentDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartnerStudentDetailComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: vi.fn() } } } },
        { provide: Router, useValue: { navigate: vi.fn(), events: of(), url: '/' } },
        { provide: PartnerStudentService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PartnerStudentDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
