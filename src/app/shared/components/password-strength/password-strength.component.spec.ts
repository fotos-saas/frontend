import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PasswordStrengthComponent } from './password-strength.component';

describe('PasswordStrengthComponent', () => {
  let component: PasswordStrengthComponent;
  let fixture: ComponentFixture<PasswordStrengthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasswordStrengthComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(PasswordStrengthComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(PasswordStrengthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default password', () => {
    expect(component.password()).toBe('');
  });

  it('should have default compact', () => {
    expect(component.compact()).toBe(false);
  });

  it('should compute metCount', () => {
    expect(component.metCount()).toBeDefined();
  });

  it('should compute strengthPercent', () => {
    expect(component.strengthPercent()).toBeDefined();
  });

  it('should compute strengthClass', () => {
    expect(component.strengthClass()).toBeDefined();
  });

  it('should compute strengthLabel', () => {
    expect(component.strengthLabel()).toBeDefined();
  });

  it('should compute tooltipText', () => {
    expect(component.tooltipText()).toBeDefined();
  });

  it('should compute isValid', () => {
    expect(component.isValid()).toBeDefined();
  });
});
