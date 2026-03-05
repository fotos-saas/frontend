import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FinalizationReminderDialogComponent } from './finalization-reminder-dialog.component';
import { LoggerService } from '../../../core/services/logger.service';

describe('FinalizationReminderDialogComponent', () => {
  let component: FinalizationReminderDialogComponent;
  let fixture: ComponentFixture<FinalizationReminderDialogComponent>;

  beforeEach(async () => {
    const mockLoggerService = {};

    await TestBed.configureTestingModule({
      imports: [FinalizationReminderDialogComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: LoggerService, useValue: mockLoggerService }
      ],
    })
    .overrideComponent(FinalizationReminderDialogComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinalizationReminderDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
