import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ScheduleReminderDialogComponent } from './schedule-reminder-dialog.component';
import { LoggerService } from '../../../core/services/logger.service';

describe('ScheduleReminderDialogComponent', () => {
  let component: ScheduleReminderDialogComponent;
  let fixture: ComponentFixture<ScheduleReminderDialogComponent>;

  beforeEach(async () => {
    const mockLoggerService = {};

    await TestBed.configureTestingModule({
      imports: [ScheduleReminderDialogComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: LoggerService, useValue: mockLoggerService }
      ],
    })
    .overrideComponent(ScheduleReminderDialogComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScheduleReminderDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
