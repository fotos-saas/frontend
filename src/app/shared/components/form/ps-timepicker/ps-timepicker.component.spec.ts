import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PsTimepickerComponent } from './ps-timepicker.component';

describe('PsTimepickerComponent', () => {
  let component: PsTimepickerComponent;
  let fixture: ComponentFixture<PsTimepickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PsTimepickerComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(PsTimepickerComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(PsTimepickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default minuteStep', () => {
    expect(component.minuteStep()).toBe(1);
  });

  it('should compute selectedHour', () => {
    expect(component.selectedHour()).toBeDefined();
  });

  it('should compute selectedMinute', () => {
    expect(component.selectedMinute()).toBeDefined();
  });

  it('should compute displayValue', () => {
    expect(component.displayValue()).toBeDefined();
  });

  it('should compute filteredMinutes', () => {
    expect(component.filteredMinutes()).toBeDefined();
  });
});
