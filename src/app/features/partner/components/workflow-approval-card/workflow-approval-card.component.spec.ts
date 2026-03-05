import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { WorkflowApprovalCardComponent } from './workflow-approval-card.component';

describe('WorkflowApprovalCardComponent', () => {
  let component: WorkflowApprovalCardComponent;
  let fixture: ComponentFixture<WorkflowApprovalCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkflowApprovalCardComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkflowApprovalCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
