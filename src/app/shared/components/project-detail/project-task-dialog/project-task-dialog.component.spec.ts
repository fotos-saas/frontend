import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ProjectTaskDialogComponent } from './project-task-dialog.component';
import { PartnerTaskService } from '../../../../features/partner/services/partner-task.service';
import { ToastService } from '../../../../core/services/toast.service';

describe('ProjectTaskDialogComponent', () => {
  let component: ProjectTaskDialogComponent;
  let fixture: ComponentFixture<ProjectTaskDialogComponent>;

  beforeEach(async () => {
    const mockPartnerTaskService = {
      getAssignees: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      updateTask: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      createTask: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() })
    };
    const mockToastService = {
      error: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() }),
      success: vi.fn().mockReturnValue({ pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }), subscribe: vi.fn() })
    };

    await TestBed.configureTestingModule({
      imports: [ProjectTaskDialogComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: PartnerTaskService, useValue: mockPartnerTaskService },
        { provide: ToastService, useValue: mockToastService }
      ],
    })
    .overrideComponent(ProjectTaskDialogComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectTaskDialogComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('projectId', 0);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit close', () => {
    const spy = vi.fn();
    component.close.subscribe(spy);
    component.close.emit();
    expect(spy).toHaveBeenCalled();
  });
});
