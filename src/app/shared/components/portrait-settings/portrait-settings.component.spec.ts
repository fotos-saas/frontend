import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PortraitSettingsComponent } from './portrait-settings.component';
import { PortraitSettingsActionsService } from './portrait-settings-actions.service';
import { ToastService } from '../../../core/services/toast.service';

describe('PortraitSettingsComponent', () => {
  let component: PortraitSettingsComponent;
  let fixture: ComponentFixture<PortraitSettingsComponent>;

  beforeEach(async () => {
    const mockPortraitSettingsActionsService = {};
    const mockToastService = {};

    await TestBed.configureTestingModule({
      imports: [PortraitSettingsComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: PortraitSettingsActionsService, useValue: mockPortraitSettingsActionsService },
        { provide: ToastService, useValue: mockToastService }
      ],
    })
    .overrideComponent(PortraitSettingsComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(PortraitSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute settings', () => {
    expect(component.settings()).toBeDefined();
  });

  it('should compute isReplace', () => {
    expect(component.isReplace()).toBeDefined();
  });

  it('should compute isDarken', () => {
    expect(component.isDarken()).toBeDefined();
  });

  it('should compute selectedPresetLabel', () => {
    expect(component.selectedPresetLabel()).toBeDefined();
  });

  it('should compute colorPreviewStyle', () => {
    expect(component.colorPreviewStyle()).toBeDefined();
  });

  it('should compute gradientPreviewStyle', () => {
    expect(component.gradientPreviewStyle()).toBeDefined();
  });
});
