import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ProjectDetailTabsComponent } from './project-detail-tabs.component';

describe('ProjectDetailTabsComponent', () => {
  let component: ProjectDetailTabsComponent;
  let fixture: ComponentFixture<ProjectDetailTabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectDetailTabsComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(ProjectDetailTabsComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectDetailTabsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('activeTab', 'test' as any);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute pinnedTabs', () => {
    expect(component.pinnedTabs()).toBeDefined();
  });

  it('should compute moreTabs', () => {
    expect(component.moreTabs()).toBeDefined();
  });

  it('should compute activeMoreTab', () => {
    expect(component.activeMoreTab()).toBeDefined();
  });
});
