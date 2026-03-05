import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DialogWrapperComponent } from './dialog-wrapper.component';

describe('DialogWrapperComponent', () => {
  let component: DialogWrapperComponent;
  let fixture: ComponentFixture<DialogWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogWrapperComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(DialogWrapperComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogWrapperComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'test');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default headerStyle', () => {
    expect(component.headerStyle()).toBe('flat');
  });

  it('should have default theme', () => {
    expect(component.theme()).toBe('blue');
  });

  it('should have default icon', () => {
    expect(component.icon()).toBe('');
  });

  it('should have default description', () => {
    expect(component.description()).toBe('');
  });

  it('should have default size', () => {
    expect(component.size()).toBe('md');
  });

  it('should have default columns', () => {
    expect(component.columns()).toBe(1);
  });

  it('should have default footerAlign', () => {
    expect(component.footerAlign()).toBe('end');
  });

  it('should have default closable', () => {
    expect(component.closable()).toBe(true);
  });

  it('should have default isSubmitting', () => {
    expect(component.isSubmitting()).toBe(false);
  });

  it('should emit closeEvent', () => {
    const spy = vi.fn();
    component.closeEvent.subscribe(spy);
    component.closeEvent.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit backdropClickEvent', () => {
    const spy = vi.fn();
    component.backdropClickEvent.subscribe(spy);
    component.backdropClickEvent.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit submitEvent', () => {
    const spy = vi.fn();
    component.submitEvent.subscribe(spy);
    component.submitEvent.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should compute themeColors', () => {
    expect(component.themeColors()).toBeDefined();
  });

  it('should compute maxWidth', () => {
    expect(component.maxWidth()).toBeDefined();
  });

  it('should compute shouldShowCloseButton', () => {
    expect(component.shouldShowCloseButton()).toBeDefined();
  });
});
