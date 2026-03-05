import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { WorkflowStatusBadgeComponent } from './workflow-status-badge.component';

describe('WorkflowStatusBadgeComponent', () => {
  let component: WorkflowStatusBadgeComponent;
  let fixture: ComponentFixture<WorkflowStatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkflowStatusBadgeComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkflowStatusBadgeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
