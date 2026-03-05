import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PsDatepickerComponent } from './ps-datepicker.component';

describe('PsDatepickerComponent', () => {
  let component: PsDatepickerComponent;
  let fixture: ComponentFixture<PsDatepickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PsDatepickerComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(PsDatepickerComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(PsDatepickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default min', () => {
    expect(component.min()).toBe('');
  });

  it('should have default max', () => {
    expect(component.max()).toBe('');
  });

  it('should compute displayValue', () => {
    expect(component.displayValue()).toBeDefined();
  });

  it('should compute calendarTitle', () => {
    expect(component.calendarTitle()).toBeDefined();
  });
});
