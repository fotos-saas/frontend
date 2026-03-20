import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { TimerBarComponent } from './timer-bar.component';
import { TimeCreditService } from '../../../features/partner/services/time-credit.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoggerService } from '../../../core/services/logger.service';
import type { TimerState } from '../../../features/partner/models/time-credit.models';

describe('TimerBarComponent', () => {
  let component: TimerBarComponent;
  let fixture: ComponentFixture<TimerBarComponent>;
  let service: jasmine.SpyObj<TimeCreditService>;
  let toast: jasmine.SpyObj<ToastService>;
  let logger: jasmine.SpyObj<LoggerService>;

  const mockTimer: TimerState = {
    id: 1,
    is_running: true,
    is_paused: false,
    project_id: 10,
    project_name: 'Test Project',
    work_type: 'retouch',
    description: null,
    started_at: '2026-01-15T10:00:00Z',
    elapsed_seconds: 3661,
    elapsed_formatted: '01:01:01',
    auto_stop_hours: 8,
    auto_stop_at: '2026-01-15T18:00:00Z',
  };

  const mockTimer2: TimerState = {
    ...mockTimer,
    id: 2,
    project_name: 'Test Project 2',
    is_running: false,
    is_paused: true,
    elapsed_seconds: 120,
  };

  const timersSignal = signal<TimerState[]>([]);

  beforeEach(async () => {
    service = jasmine.createSpyObj('TimeCreditService', [
      'loadTimers',
      'pauseTimer',
      'resumeTimer',
      'stopTimer',
      'stopAllTimers',
    ]);
    // Create a writable timers signal on the spy
    Object.defineProperty(service, 'timers', { get: () => timersSignal });

    toast = jasmine.createSpyObj('ToastService', ['success', 'error', 'info']);
    logger = jasmine.createSpyObj('LoggerService', ['error', 'info', 'warn', 'debug']);

    service.loadTimers.and.callFake(() => {
      timersSignal.set([mockTimer]);
      return of([mockTimer]);
    });
    service.pauseTimer.and.returnValue(of(undefined));
    service.resumeTimer.and.returnValue(of(undefined));
    service.stopTimer.and.returnValue(of({ id: 1, minutes: 61 }));
    service.stopAllTimers.and.returnValue(of({ stopped_count: 2 }));

    await TestBed.configureTestingModule({
      imports: [TimerBarComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: TimeCreditService, useValue: service },
        { provide: ToastService, useValue: toast },
        { provide: LoggerService, useValue: logger },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TimerBarComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    // Ensure intervals are cleared
    component.ngOnDestroy();
    timersSignal.set([]);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load timers on init', fakeAsync(() => {
    fixture.detectChanges();
    tick(0);

    expect(service.loadTimers).toHaveBeenCalled();
  }));

  it('should set showStopAll when more than 1 timer', fakeAsync(() => {
    service.loadTimers.and.callFake(() => {
      timersSignal.set([mockTimer, mockTimer2]);
      return of([mockTimer, mockTimer2]);
    });

    fixture.detectChanges();
    tick(0);

    expect(component.showStopAll()).toBeTrue();
  }));

  it('should set showStopAll false when 1 or fewer timers', fakeAsync(() => {
    fixture.detectChanges();
    tick(0);

    expect(component.showStopAll()).toBeFalse();
  }));

  it('should format display time for running timer with offset', () => {
    fixture.detectChanges();
    // elapsed_seconds = 3661 + offset 0 = 3661 => 01:01:01
    const result = component.getDisplayTime(mockTimer);
    expect(result).toBe('01:01:01');
  });

  it('should format display time for paused timer without offset', () => {
    fixture.detectChanges();
    // elapsed_seconds = 120, not running, offset ignored => 00:02:00
    const result = component.getDisplayTime(mockTimer2);
    expect(result).toBe('00:02:00');
  });

  it('should call pauseTimer and reload', fakeAsync(() => {
    fixture.detectChanges();
    tick(0);
    service.loadTimers.calls.reset();

    component.pause(1);
    tick(0);

    expect(service.pauseTimer).toHaveBeenCalledWith(1);
    expect(service.loadTimers).toHaveBeenCalled();
  }));

  it('should call resumeTimer and reload', fakeAsync(() => {
    fixture.detectChanges();
    tick(0);
    service.loadTimers.calls.reset();

    component.resume(1);
    tick(0);

    expect(service.resumeTimer).toHaveBeenCalledWith(1);
    expect(service.loadTimers).toHaveBeenCalled();
  }));

  it('should call stopTimer, show toast, and reload', fakeAsync(() => {
    fixture.detectChanges();
    tick(0);
    service.loadTimers.calls.reset();

    component.stop(1);
    tick(0);

    expect(service.stopTimer).toHaveBeenCalledWith(1);
    expect(toast.success).toHaveBeenCalled();
    expect(service.loadTimers).toHaveBeenCalled();
  }));

  it('should call stopAllTimers, show toast, and reload', fakeAsync(() => {
    fixture.detectChanges();
    tick(0);
    service.loadTimers.calls.reset();

    component.stopAll();
    tick(0);

    expect(service.stopAllTimers).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
    expect(service.loadTimers).toHaveBeenCalled();
  }));

  it('should log error on pauseTimer failure', fakeAsync(() => {
    fixture.detectChanges();
    tick(0);
    service.pauseTimer.and.returnValue(throwError(() => new Error('fail')));

    component.pause(1);
    tick(0);

    expect(logger.error).toHaveBeenCalled();
  }));
});
