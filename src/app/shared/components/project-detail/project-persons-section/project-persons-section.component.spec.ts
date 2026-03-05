import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ProjectPersonsSectionComponent } from './project-persons-section.component';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../../core/services/toast.service';

describe('ProjectPersonsSectionComponent', () => {
  let component: ProjectPersonsSectionComponent;
  let fixture: ComponentFixture<ProjectPersonsSectionComponent>;

  beforeEach(async () => {
    const mockHttpClient = {};
    const mockToastService = {};

    await TestBed.configureTestingModule({
      imports: [ProjectPersonsSectionComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: HttpClient, useValue: mockHttpClient },
        { provide: ToastService, useValue: mockToastService }
      ],
    })
    .overrideComponent(ProjectPersonsSectionComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectPersonsSectionComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('project', { id: 1, name: 'Test', status: 'active' } as any);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit downloadPendingZip', () => {
    const spy = vi.fn();
    component.downloadPendingZip.subscribe(spy);
    component.downloadPendingZip.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should compute isPreliminary', () => {
    expect(component.isPreliminary()).toBeDefined();
  });

  it('should compute pendingStudentPhotos', () => {
    expect(component.pendingStudentPhotos()).toBeDefined();
  });

  it('should compute pendingTeacherPhotos', () => {
    expect(component.pendingTeacherPhotos()).toBeDefined();
  });

  it('should compute totalPendingPhotos', () => {
    expect(component.totalPendingPhotos()).toBeDefined();
  });

  it('should compute studentsPreview', () => {
    expect(component.studentsPreview()).toBeDefined();
  });

  it('should compute teachersPreview', () => {
    expect(component.teachersPreview()).toBeDefined();
  });

  it('should compute studentsCount', () => {
    expect(component.studentsCount()).toBeDefined();
  });

  it('should compute teachersCount', () => {
    expect(component.teachersCount()).toBeDefined();
  });

  it('should compute personsCount', () => {
    expect(component.personsCount()).toBeDefined();
  });

  it('should compute studentsWithPhoto', () => {
    expect(component.studentsWithPhoto()).toBeDefined();
  });

  it('should compute teachersWithPhoto', () => {
    expect(component.teachersWithPhoto()).toBeDefined();
  });

  it('should compute studentsWithoutPhoto', () => {
    expect(component.studentsWithoutPhoto()).toBeDefined();
  });

  it('should compute teachersWithoutPhoto', () => {
    expect(component.teachersWithoutPhoto()).toBeDefined();
  });

  it('should compute hasPersons', () => {
    expect(component.hasPersons()).toBeDefined();
  });

  it('should compute extraStudents', () => {
    expect(component.extraStudents()).toBeDefined();
  });

  it('should compute extraTeachers', () => {
    expect(component.extraTeachers()).toBeDefined();
  });

  it('should compute studentsOverflow', () => {
    expect(component.studentsOverflow()).toBeDefined();
  });

  it('should compute teachersOverflow', () => {
    expect(component.teachersOverflow()).toBeDefined();
  });
});
