import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, Component } from '@angular/core';
import { BaseDialogComponent } from './base-dialog.component';

@Component({
  selector: 'app-test-dialog',
  standalone: true,
  template: '<div>test</div>',
})
class TestDialogComponent extends BaseDialogComponent {
  protected onSubmit(): void {}
  protected onClose(): void {
    this.dialogCloseEvent.emit();
  }
}

describe('BaseDialogComponent', () => {
  let component: TestDialogComponent;
  let fixture: ComponentFixture<TestDialogComponent>;

  beforeEach(async () => {
    window.scrollTo = vi.fn() as any;

    await TestBed.configureTestingModule({
      imports: [TestDialogComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TestDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have isSubmitting as false initially', () => {
    expect(component.isSubmitting()).toBe(false);
  });

  it('should have errorMessage as null initially', () => {
    expect(component.errorMessage()).toBeNull();
  });

  it('should emit dialogCloseEvent', () => {
    const spy = vi.fn();
    component.dialogCloseEvent.subscribe(spy);
    component.dialogCloseEvent.emit();
    expect(spy).toHaveBeenCalled();
  });
});
