import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(ConfirmDialogComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default title', () => {
    expect(component.title()).toBe('Megerősítés');
  });

  it('should have default message', () => {
    expect(component.message()).toBe('Biztosan folytatod?');
  });

  it('should have default confirmText', () => {
    expect(component.confirmText()).toBe('Törlés');
  });

  it('should have default cancelText', () => {
    expect(component.cancelText()).toBe('Mégse');
  });

  it('should have default confirmType', () => {
    expect(component.confirmType()).toBe('danger');
  });

  it('should have default isSubmitting', () => {
    expect(component.isSubmitting()).toBe(false);
  });

  it('should have default showCancel', () => {
    expect(component.showCancel()).toBe(true);
  });
});
