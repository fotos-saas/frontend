import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ProjectCreateWrapperComponent } from './project-create-wrapper.component';
import { LoggerService } from '@core/services/logger.service';
import { PROJECT_CREATE_SERVICE } from './project-create.tokens';
import { Router } from '@angular/router';
import { PROJECT_CREATE_ROUTE_PREFIX } from './project-create.tokens';

describe('ProjectCreateWrapperComponent', () => {
  let component: ProjectCreateWrapperComponent;
  let fixture: ComponentFixture<ProjectCreateWrapperComponent>;

  beforeEach(async () => {
    const mockLoggerService = {};
    const mockPROJECT_CREATE_SERVICE = {};
    const mockPROJECT_CREATE_ROUTE_PREFIX = {};

    await TestBed.configureTestingModule({
      imports: [ProjectCreateWrapperComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: PROJECT_CREATE_SERVICE, useValue: mockPROJECT_CREATE_SERVICE },
        { provide: Router, useValue: { navigate: vi.fn(), events: { subscribe: vi.fn() }, url: '/' } },
        { provide: PROJECT_CREATE_ROUTE_PREFIX, useValue: mockPROJECT_CREATE_ROUTE_PREFIX }
      ],
    })
    .overrideComponent(ProjectCreateWrapperComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectCreateWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
