import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BugReportListComponent } from './bug-report-list.component';
import { BugReportService } from '../../../../shared/services/bug-report.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('BugReportListComponent', () => {
  let component: BugReportListComponent;
  let fixture: ComponentFixture<BugReportListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BugReportListComponent],
      providers: [
        { provide: BugReportService, useValue: {} },
        { provide: Router, useValue: { navigate: vi.fn(), events: of(), url: '/' } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(BugReportListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
