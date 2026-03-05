import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AddButtonComponent } from './add-button.component';

describe('AddButtonComponent', () => {
  let component: AddButtonComponent;
  let fixture: ComponentFixture<AddButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddButtonComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(AddButtonComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default variant', () => {
    expect(component.variant()).toBe('primary');
  });

  it('should have default size', () => {
    expect(component.size()).toBe(18);
  });

  it('should have default label', () => {
    expect(component.label()).toBe('Új');
  });

  it('should have default display', () => {
    expect(component.display()).toBe('icon-text');
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
