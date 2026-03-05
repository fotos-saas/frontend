import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ClassSizeDialogComponent } from './class-size-dialog.component';

describe('ClassSizeDialogComponent', () => {
  let component: ClassSizeDialogComponent;
  let fixture: ComponentFixture<ClassSizeDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClassSizeDialogComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(ClassSizeDialogComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClassSizeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute isBusy', () => {
    expect(component.isBusy()).toBeDefined();
  });

  it('should compute apiError', () => {
    expect(component.apiError()).toBeDefined();
  });
});
