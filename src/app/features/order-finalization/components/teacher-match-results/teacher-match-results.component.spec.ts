import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TeacherMatchResultsComponent } from './teacher-match-results.component';

describe('TeacherMatchResultsComponent', () => {
  let component: TeacherMatchResultsComponent;
  let fixture: ComponentFixture<TeacherMatchResultsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeacherMatchResultsComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TeacherMatchResultsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
