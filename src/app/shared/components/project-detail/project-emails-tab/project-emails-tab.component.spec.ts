import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ProjectEmailsTabComponent } from './project-emails-tab.component';
import { ProjectEmailsActionsService } from './project-emails-actions.service';

describe('ProjectEmailsTabComponent', () => {
  let component: ProjectEmailsTabComponent;
  let fixture: ComponentFixture<ProjectEmailsTabComponent>;

  beforeEach(async () => {
    const mockProjectEmailsActionsService = {};

    await TestBed.configureTestingModule({
      imports: [ProjectEmailsTabComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: ProjectEmailsActionsService, useValue: mockProjectEmailsActionsService }
      ],
    })
    .overrideComponent(ProjectEmailsTabComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectEmailsTabComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('projectId', 0);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
