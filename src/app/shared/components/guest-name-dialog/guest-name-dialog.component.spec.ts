import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { GuestNameDialogComponent } from './guest-name-dialog.component';

describe('GuestNameDialogComponent', () => {
  let component: GuestNameDialogComponent;
  let fixture: ComponentFixture<GuestNameDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuestNameDialogComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(GuestNameDialogComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(GuestNameDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default mode', () => {
    expect(component.mode()).toBe('register');
  });

  it('should have default initialName', () => {
    expect(component.initialName()).toBe('');
  });

  it('should have default initialEmail', () => {
    expect(component.initialEmail()).toBe('');
  });

  it('should have default canClose', () => {
    expect(component.canClose()).toBe(false);
  });

  it('should compute isBusy', () => {
    expect(component.isBusy()).toBeDefined();
  });

  it('should compute apiError', () => {
    expect(component.apiError()).toBeDefined();
  });

  it('should compute dialogTheme', () => {
    expect(component.dialogTheme()).toBeDefined();
  });

  it('should compute dialogIcon', () => {
    expect(component.dialogIcon()).toBeDefined();
  });

  it('should compute dialogTitle', () => {
    expect(component.dialogTitle()).toBeDefined();
  });

  it('should compute dialogDescription', () => {
    expect(component.dialogDescription()).toBeDefined();
  });

  it('should compute submitButtonText', () => {
    expect(component.submitButtonText()).toBeDefined();
  });

  it('should compute submitIcon', () => {
    expect(component.submitIcon()).toBeDefined();
  });
});
