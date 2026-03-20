import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { UsageMeterComponent } from './usage-meter.component';
import type { UsageState } from '../../../features/partner/models/time-credit.models';

describe('UsageMeterComponent', () => {
  let component: UsageMeterComponent;
  let fixture: ComponentFixture<UsageMeterComponent>;

  const mockUsage: UsageState = {
    used_minutes: 80,
    included_minutes: 100,
    remaining_minutes: 20,
    percentage: 80,
    state: 'normal',
    overage_minutes: 0,
    overage_started_hours: 0,
    overage_cost: 0,
    overage_rate: 0,
    overage_confirmed: false,
    formatted: {
      used: '1h 20m',
      included: '1h 40m',
      remaining: '20m',
      overage: '0m',
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsageMeterComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(UsageMeterComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('usage', mockUsage);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should compute fillWidth as percentage capped at 100', () => {
    fixture.componentRef.setInput('usage', mockUsage);
    fixture.detectChanges();

    expect(component.fillWidth()).toBe(80);
  });

  it('should cap fillWidth at 100 when percentage exceeds 100', () => {
    fixture.componentRef.setInput('usage', { ...mockUsage, percentage: 130 });
    fixture.detectChanges();

    expect(component.fillWidth()).toBe(100);
  });

  it('should compute overageWidth as 0 when under 100%', () => {
    fixture.componentRef.setInput('usage', mockUsage);
    fixture.detectChanges();

    expect(component.overageWidth()).toBe(0);
  });

  it('should compute overageWidth when percentage exceeds 100', () => {
    fixture.componentRef.setInput('usage', { ...mockUsage, percentage: 120 });
    fixture.detectChanges();

    expect(component.overageWidth()).toBe(20);
  });

  it('should cap overageWidth at 50', () => {
    fixture.componentRef.setInput('usage', { ...mockUsage, percentage: 200 });
    fixture.detectChanges();

    expect(component.overageWidth()).toBe(50);
  });

  it('should handle exactly 100% usage', () => {
    fixture.componentRef.setInput('usage', { ...mockUsage, percentage: 100 });
    fixture.detectChanges();

    expect(component.fillWidth()).toBe(100);
    expect(component.overageWidth()).toBe(0);
  });

  it('should have compact default as false', () => {
    fixture.componentRef.setInput('usage', mockUsage);
    fixture.detectChanges();

    expect(component.compact()).toBeFalse();
  });

  it('should accept compact input', () => {
    fixture.componentRef.setInput('usage', mockUsage);
    fixture.componentRef.setInput('compact', true);
    fixture.detectChanges();

    expect(component.compact()).toBeTrue();
  });
});
