import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ScheduleCardComponent } from './schedule-card.component';

describe('ScheduleCardComponent', () => {
  let component: ScheduleCardComponent;
  let fixture: ComponentFixture<ScheduleCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleCardComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(ScheduleCardComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScheduleCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default isLoading', () => {
    expect(component.isLoading()).toBe(false);
  });

  it('should have default isDisabled', () => {
    expect(component.isDisabled()).toBe(false);
  });

  it('should have default label', () => {
    expect(component.label()).toBe('Fotózás időpontja');
  });

  it('should emit editClickEvent', () => {
    const spy = vi.fn();
    component.editClickEvent.subscribe(spy);
    component.editClickEvent.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit cardClickEvent', () => {
    const spy = vi.fn();
    component.cardClickEvent.subscribe(spy);
    component.cardClickEvent.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should compute isSuccess', () => {
    expect(component.isSuccess()).toBeDefined();
  });

  it('should compute statusText', () => {
    expect(component.statusText()).toBeDefined();
  });

  it('should compute displayValue', () => {
    expect(component.displayValue()).toBeDefined();
  });

  it('should compute bemModifier', () => {
    expect(component.bemModifier()).toBeDefined();
  });
});
