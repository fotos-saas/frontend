import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ProjectActivityTabComponent } from './project-activity-tab.component';
import { PartnerActivityService } from '../../../../features/partner/services/partner-activity.service';
import { DatePipe } from '@angular/common';

describe('ProjectActivityTabComponent', () => {
  let component: ProjectActivityTabComponent;
  let fixture: ComponentFixture<ProjectActivityTabComponent>;

  beforeEach(async () => {
    const mockPartnerActivityService = {
      getProjectActivity: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() })
    };

    await TestBed.configureTestingModule({
      imports: [ProjectActivityTabComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: PartnerActivityService, useValue: mockPartnerActivityService }
      ],
    })
    .overrideComponent(ProjectActivityTabComponent, {
      set: { imports: [DatePipe], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectActivityTabComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('projectId', 0);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
