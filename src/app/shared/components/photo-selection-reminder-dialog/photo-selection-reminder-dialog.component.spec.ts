import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PhotoSelectionReminderDialogComponent } from './photo-selection-reminder-dialog.component';

describe('PhotoSelectionReminderDialogComponent', () => {
  let component: PhotoSelectionReminderDialogComponent;
  let fixture: ComponentFixture<PhotoSelectionReminderDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhotoSelectionReminderDialogComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(PhotoSelectionReminderDialogComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(PhotoSelectionReminderDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default currentStep', () => {
    expect(component.currentStep()).toBe('claiming');
  });
});
