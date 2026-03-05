import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ProjectSettingsTabComponent } from './project-settings-tab.component';
import { PartnerService } from '../../../../features/partner/services/partner.service';
import { ToastService } from '../../../../core/services/toast.service';

describe('ProjectSettingsTabComponent', () => {
  let component: ProjectSettingsTabComponent;
  let fixture: ComponentFixture<ProjectSettingsTabComponent>;

  beforeEach(async () => {
    const mockPartnerService = {
      getProjectSettings: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      updateProjectSettings: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() })
    };
    const mockToastService = {
      error: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      success: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() })
    };

    await TestBed.configureTestingModule({
      imports: [ProjectSettingsTabComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: PartnerService, useValue: mockPartnerService },
        { provide: ToastService, useValue: mockToastService }
      ],
    })
    .overrideComponent(ProjectSettingsTabComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectSettingsTabComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('projectId', 0);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
