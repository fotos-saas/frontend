import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { QrButtonComponent } from './qr-button.component';

describe('QrButtonComponent', () => {
  let component: QrButtonComponent;
  let fixture: ComponentFixture<QrButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QrButtonComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(QrButtonComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(QrButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default isActive', () => {
    expect(component.isActive()).toBe(false);
  });

  it('should have default variant', () => {
    expect(component.variant()).toBe('icon-only');
  });

  it('should have default size', () => {
    expect(component.size()).toBe(18);
  });

  it('should have default label', () => {
    expect(component.label()).toBe('QR Kód');
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
