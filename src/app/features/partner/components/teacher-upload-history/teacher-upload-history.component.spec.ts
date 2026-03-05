import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TeacherUploadHistoryComponent } from './teacher-upload-history.component';
import { PartnerTeacherService } from '../../services/partner-teacher.service';

describe('TeacherUploadHistoryComponent', () => {
  let component: TeacherUploadHistoryComponent;
  let fixture: ComponentFixture<TeacherUploadHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherUploadHistoryComponent],
      providers: [
        { provide: PartnerTeacherService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TeacherUploadHistoryComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
