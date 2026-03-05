import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AdminBugReportListComponent } from './bug-report-list.component';
import { BugReportService } from '../../../../shared/services/bug-report.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('AdminBugReportListComponent', () => {
  let component: AdminBugReportListComponent;
  let fixture: ComponentFixture<AdminBugReportListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminBugReportListComponent],
      providers: [
        { provide: BugReportService, useValue: {} },
        { provide: Router, useValue: { navigate: vi.fn(), events: of(), url: '/' } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminBugReportListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
