import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FloatingFabComponent } from './floating-fab.component';

describe('FloatingFabComponent', () => {
  let component: FloatingFabComponent;
  let fixture: ComponentFixture<FloatingFabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FloatingFabComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(FloatingFabComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(FloatingFabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default icon', () => {
    expect(component.icon()).toBe('info');
  });

  it('should have default color', () => {
    expect(component.color()).toBe('blue');
  });

  it('should have default panelWidth', () => {
    expect(component.panelWidth()).toBe('normal');
  });

  it('should have default ariaLabel', () => {
    expect(component.ariaLabel()).toBe('Információ');
  });
});
