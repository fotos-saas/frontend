import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PsInputComponent } from './ps-input.component';

describe('PsInputComponent', () => {
  let component: PsInputComponent;
  let fixture: ComponentFixture<PsInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PsInputComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(PsInputComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(PsInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default type', () => {
    expect(component.type()).toBe('text');
  });

  it('should have default prefix', () => {
    expect(component.prefix()).toBe('');
  });

  it('should have default suffix', () => {
    expect(component.suffix()).toBe('');
  });

  it('should have default min', () => {
    expect(component.min()).toBe('');
  });

  it('should have default max', () => {
    expect(component.max()).toBe('');
  });

  it('should have default step', () => {
    expect(component.step()).toBe('');
  });

  it('should have default autocomplete', () => {
    expect(component.autocomplete()).toBe('');
  });

  it('should compute effectiveType', () => {
    expect(component.effectiveType()).toBeDefined();
  });

  it('should compute showPasswordToggle', () => {
    expect(component.showPasswordToggle()).toBeDefined();
  });

  it('should compute hasHelp', () => {
    expect(component.hasHelp()).toBeDefined();
  });

  it('should compute showSuccessIcon', () => {
    expect(component.showSuccessIcon()).toBeDefined();
  });

  it('should compute isIconSuffix', () => {
    expect(component.isIconSuffix()).toBeDefined();
  });
});
