import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { GuidedTourTooltipComponent } from './guided-tour-tooltip.component';

describe('GuidedTourTooltipComponent', () => {
  let component: GuidedTourTooltipComponent;
  let fixture: ComponentFixture<GuidedTourTooltipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuidedTourTooltipComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(GuidedTourTooltipComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(GuidedTourTooltipComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('step', 0);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default isFirstStep', () => {
    expect(component.isFirstStep()).toBe(false);
  });

  it('should have default isLastStep', () => {
    expect(component.isLastStep()).toBe(false);
  });

  it('should have default stepCounter', () => {
    expect(component.stepCounter()).toBe('');
  });

  it('should have default arrowPosition', () => {
    expect(component.arrowPosition()).toBe('none');
  });

  it('should have default progressPercent', () => {
    expect(component.progressPercent()).toBe(0);
  });

  it('should emit nextEvent', () => {
    const spy = vi.fn();
    component.nextEvent.subscribe(spy);
    component.nextEvent.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit previousEvent', () => {
    const spy = vi.fn();
    component.previousEvent.subscribe(spy);
    component.previousEvent.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit skipEvent', () => {
    const spy = vi.fn();
    component.skipEvent.subscribe(spy);
    component.skipEvent.emit();
    expect(spy).toHaveBeenCalled();
  });
});
