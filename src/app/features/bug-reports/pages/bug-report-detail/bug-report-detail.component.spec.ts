import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BugReportDetailComponent } from './bug-report-detail.component';
import { BugReportService } from '../../../../shared/services/bug-report.service';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('BugReportDetailComponent', () => {
  let component: BugReportDetailComponent;
  let fixture: ComponentFixture<BugReportDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BugReportDetailComponent],
      providers: [
        { provide: BugReportService, useValue: {} },
        { provide: ActivatedRoute, useValue: { params: of({}), queryParams: of({}), snapshot: { params: {}, queryParams: {}, paramMap: { get: vi.fn() } } } },
        { provide: Router, useValue: { navigate: vi.fn(), events: of(), url: '/' } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(BugReportDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
