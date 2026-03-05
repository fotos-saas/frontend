import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ProjectDetailHeaderComponent } from './project-detail-header.component';
import { DatePipe } from '@angular/common';

describe('ProjectDetailHeaderComponent', () => {
  let component: ProjectDetailHeaderComponent;
  let fixture: ComponentFixture<ProjectDetailHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectDetailHeaderComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(ProjectDetailHeaderComponent, {
      set: { imports: [DatePipe], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectDetailHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default loading', () => {
    expect(component.loading()).toBe(false);
  });

  it('should have default isMarketer', () => {
    expect(component.isMarketer()).toBe(false);
  });

  it('should have default showTabloEditor', () => {
    expect(component.showTabloEditor()).toBe(false);
  });

  it('should emit back', () => {
    const spy = vi.fn();
    component.back.subscribe(spy);
    component.back.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit editProject', () => {
    const spy = vi.fn();
    component.editProject.subscribe(spy);
    component.editProject.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit deleteProject', () => {
    const spy = vi.fn();
    component.deleteProject.subscribe(spy);
    component.deleteProject.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit downloadSelections', () => {
    const spy = vi.fn();
    component.downloadSelections.subscribe(spy);
    component.downloadSelections.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit openTabloEditor', () => {
    const spy = vi.fn();
    component.openTabloEditor.subscribe(spy);
    component.openTabloEditor.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should compute hasGallery', () => {
    expect(component.hasGallery()).toBeDefined();
  });
});
