import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CropSettingsComponent } from './crop-settings.component';
import { CropSettingsActionsService } from './crop-settings-actions.service';

describe('CropSettingsComponent', () => {
  let component: CropSettingsComponent;
  let fixture: ComponentFixture<CropSettingsComponent>;

  beforeEach(async () => {
    const mockCropSettingsActionsService = {};

    await TestBed.configureTestingModule({
      imports: [CropSettingsComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: CropSettingsActionsService, useValue: mockCropSettingsActionsService }
      ],
    })
    .overrideComponent(CropSettingsComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(CropSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit openCalibration', () => {
    const spy = vi.fn();
    component.openCalibration.subscribe(spy);
    component.openCalibration.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should compute settings', () => {
    expect(component.settings()).toBeDefined();
  });

  it('should compute isCustomPreset', () => {
    expect(component.isCustomPreset()).toBeDefined();
  });

  it('should compute activePresetLabel', () => {
    expect(component.activePresetLabel()).toBeDefined();
  });
});
