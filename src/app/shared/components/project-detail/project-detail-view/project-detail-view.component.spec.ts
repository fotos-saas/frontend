import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ProjectDetailViewComponent } from './project-detail-view.component';
import { ClipboardService } from '../../../../core/services/clipboard.service';
import { FeatureToggleService } from '../../../../core/services/feature-toggle.service';
import { DatePipe } from '@angular/common';

describe('ProjectDetailViewComponent', () => {
  let component: ProjectDetailViewComponent;
  let fixture: ComponentFixture<ProjectDetailViewComponent>;

  beforeEach(async () => {
    const mockClipboardService = {};
    const mockFeatureToggleService = {};

    await TestBed.configureTestingModule({
      imports: [ProjectDetailViewComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: ClipboardService, useValue: mockClipboardService },
        { provide: FeatureToggleService, useValue: mockFeatureToggleService }
      ],
    })
    .overrideComponent(ProjectDetailViewComponent, {
      set: { imports: [DatePipe], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectDetailViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default isMarketer', () => {
    expect(component.isMarketer()).toBe(false);
  });

  it('should emit downloadPendingZip', () => {
    const spy = vi.fn();
    component.downloadPendingZip.subscribe(spy);
    component.downloadPendingZip.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit openQrModal', () => {
    const spy = vi.fn();
    component.openQrModal.subscribe(spy);
    component.openQrModal.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit openOrderData', () => {
    const spy = vi.fn();
    component.openOrderData.subscribe(spy);
    component.openOrderData.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit openOrderWizard', () => {
    const spy = vi.fn();
    component.openOrderWizard.subscribe(spy);
    component.openOrderWizard.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit createGallery', () => {
    const spy = vi.fn();
    component.createGallery.subscribe(spy);
    component.createGallery.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should compute personsApiUrl', () => {
    expect(component.personsApiUrl()).toBeDefined();
  });
});
