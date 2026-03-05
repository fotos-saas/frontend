import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ProjectPrintTabComponent } from './project-print-tab.component';
import { ProjectPrintTabStateService } from './project-print-tab-state.service';
import { DatePipe } from '@angular/common';

describe('ProjectPrintTabComponent', () => {
  let component: ProjectPrintTabComponent;
  let fixture: ComponentFixture<ProjectPrintTabComponent>;

  beforeEach(async () => {
    const mockProjectPrintTabStateService = {};

    await TestBed.configureTestingModule({
      imports: [ProjectPrintTabComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: ProjectPrintTabStateService, useValue: mockProjectPrintTabStateService }
      ],
    })
    .overrideComponent(ProjectPrintTabComponent, {
      set: { imports: [DatePipe], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectPrintTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
