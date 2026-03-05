import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TasksOverviewComponent } from './tasks-overview.component';
import { PartnerTaskService } from '../../services/partner-task.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { of } from 'rxjs';

describe('TasksOverviewComponent', () => {
  let component: TasksOverviewComponent;
  let fixture: ComponentFixture<TasksOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TasksOverviewComponent],
      providers: [
        { provide: PartnerTaskService, useValue: {} },
        { provide: ToastService, useValue: {} },
        { provide: Router, useValue: { navigate: vi.fn(), events: of(), url: '/' } },
        { provide: AuthService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TasksOverviewComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
