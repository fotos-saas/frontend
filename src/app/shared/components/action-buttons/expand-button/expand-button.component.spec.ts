import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ExpandButtonComponent } from './expand-button.component';

describe('ExpandButtonComponent', () => {
  let component: ExpandButtonComponent;
  let fixture: ComponentFixture<ExpandButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpandButtonComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(ExpandButtonComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpandButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default display', () => {
    expect(component.display()).toBe('icon-text');
  });

  it('should have default expanded', () => {
    expect(component.expanded()).toBe(false);
  });

  it('should have default expandLabel', () => {
    expect(component.expandLabel()).toBe('Tovább olvasom');
  });

  it('should have default collapseLabel', () => {
    expect(component.collapseLabel()).toBe('Kevesebb');
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

  it('should compute currentLabel', () => {
    expect(component.currentLabel()).toBeDefined();
  });
});
