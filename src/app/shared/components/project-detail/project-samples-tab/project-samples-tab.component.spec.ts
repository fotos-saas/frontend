import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ProjectSamplesTabComponent } from './project-samples-tab.component';
import { PartnerService } from '../../../../features/partner/services/partner.service';
import { ToastService } from '../../../../core/services/toast.service';
import { DatePipe } from '@angular/common';

describe('ProjectSamplesTabComponent', () => {
  let component: ProjectSamplesTabComponent;
  let fixture: ComponentFixture<ProjectSamplesTabComponent>;

  beforeEach(async () => {
    const mockPartnerService = {
      getSamplePackages: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      deleteSamplePackage: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      deleteSampleVersion: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() })
    };
    const mockToastService = {
      error: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      success: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() })
    };

    await TestBed.configureTestingModule({
      imports: [ProjectSamplesTabComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: PartnerService, useValue: mockPartnerService },
        { provide: ToastService, useValue: mockToastService }
      ],
    })
    .overrideComponent(ProjectSamplesTabComponent, {
      set: { imports: [DatePipe], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectSamplesTabComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('projectId', 0);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
