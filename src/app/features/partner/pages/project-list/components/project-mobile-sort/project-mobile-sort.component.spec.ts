import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ProjectMobileSortComponent } from './project-mobile-sort.component';

describe('ProjectMobileSortComponent', () => {
  let component: ProjectMobileSortComponent;
  let fixture: ComponentFixture<ProjectMobileSortComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectMobileSortComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectMobileSortComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
