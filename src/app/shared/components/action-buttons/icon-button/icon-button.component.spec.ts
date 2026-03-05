import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { IconButtonComponent } from './icon-button.component';

describe('IconButtonComponent', () => {
  let component: IconButtonComponent;
  let fixture: ComponentFixture<IconButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconButtonComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(IconButtonComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(IconButtonComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('icon', 'test');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default label', () => {
    expect(component.label()).toBe('');
  });

  it('should have default display', () => {
    expect(component.display()).toBe('icon-only');
  });

  it('should have default variant', () => {
    expect(component.variant()).toBe('default');
  });

  it('should have default size', () => {
    expect(component.size()).toBe(14);
  });

  it('should have default disabled', () => {
    expect(component.disabled()).toBe(false);
  });

  it('should emit clicked', () => {
    const spy = vi.fn();
    component.clicked.subscribe(spy);
    component.clicked.emit();
    expect(spy).toHaveBeenCalled();
  });
});
