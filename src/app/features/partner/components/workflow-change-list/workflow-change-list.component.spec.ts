import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { WorkflowChangeListComponent } from './workflow-change-list.component';

describe('WorkflowChangeListComponent', () => {
  let component: WorkflowChangeListComponent;
  let fixture: ComponentFixture<WorkflowChangeListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkflowChangeListComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkflowChangeListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
