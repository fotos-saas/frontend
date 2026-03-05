import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { WorkflowScheduleSettingsComponent } from './workflow-schedule-settings.component';
import { PartnerWorkflowService } from '../../services/partner-workflow.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('WorkflowScheduleSettingsComponent', () => {
  let component: WorkflowScheduleSettingsComponent;
  let fixture: ComponentFixture<WorkflowScheduleSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkflowScheduleSettingsComponent],
      providers: [
        { provide: PartnerWorkflowService, useValue: {} },
        { provide: Router, useValue: { navigate: vi.fn(), events: of(), url: '/' } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkflowScheduleSettingsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
