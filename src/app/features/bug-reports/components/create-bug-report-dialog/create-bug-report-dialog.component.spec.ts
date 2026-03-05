import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CreateBugReportDialogComponent } from './create-bug-report-dialog.component';
import { BugReportService } from '../../../../shared/services/bug-report.service';
import { Router } from '@angular/router';
import { ToastService } from '../../../../core/services/toast.service';
import { of } from 'rxjs';

describe('CreateBugReportDialogComponent', () => {
  let component: CreateBugReportDialogComponent;
  let fixture: ComponentFixture<CreateBugReportDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateBugReportDialogComponent],
      providers: [
        { provide: BugReportService, useValue: {} },
        { provide: Router, useValue: { navigate: vi.fn(), events: of(), url: '/' } },
        { provide: ToastService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateBugReportDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
