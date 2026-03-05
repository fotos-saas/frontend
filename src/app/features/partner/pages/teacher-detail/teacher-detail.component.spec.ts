import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PartnerTeacherDetailComponent } from './teacher-detail.component';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { PartnerTeacherService } from '../../services/partner-teacher.service';
import { of } from 'rxjs';

describe('PartnerTeacherDetailComponent', () => {
  let component: PartnerTeacherDetailComponent;
  let fixture: ComponentFixture<PartnerTeacherDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartnerTeacherDetailComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: vi.fn() } } } },
        { provide: Router, useValue: { navigate: vi.fn(), events: of(), url: '/' } },
        { provide: PartnerTeacherService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PartnerTeacherDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
