import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TeacherLinkDialogComponent } from './teacher-link-dialog.component';
import { PartnerTeacherService } from '../../services/partner-teacher.service';
import { ElectronService } from '@core/services/electron.service';

describe('TeacherLinkDialogComponent', () => {
  let component: TeacherLinkDialogComponent;
  let fixture: ComponentFixture<TeacherLinkDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherLinkDialogComponent],
      providers: [
        { provide: PartnerTeacherService, useValue: {} },
        { provide: ElectronService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TeacherLinkDialogComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
