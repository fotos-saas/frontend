import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TeacherPhotoChooserDialogComponent } from './teacher-photo-chooser-dialog.component';
import { PartnerTeacherService } from '../../services/partner-teacher.service';

describe('TeacherPhotoChooserDialogComponent', () => {
  let component: TeacherPhotoChooserDialogComponent;
  let fixture: ComponentFixture<TeacherPhotoChooserDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherPhotoChooserDialogComponent],
      providers: [
        { provide: PartnerTeacherService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TeacherPhotoChooserDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
