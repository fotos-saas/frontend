import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { WorkflowHeaderComponent } from './workflow-header.component';

describe('WorkflowHeaderComponent', () => {
  let component: WorkflowHeaderComponent;
  let fixture: ComponentFixture<WorkflowHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkflowHeaderComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkflowHeaderComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
