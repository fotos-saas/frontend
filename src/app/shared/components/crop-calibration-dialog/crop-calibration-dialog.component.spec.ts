import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CropCalibrationDialogComponent } from './crop-calibration-dialog.component';
import { ElectronCropService } from '@core/services/electron-crop.service';
import { LoggerService } from '@core/services/logger.service';

describe('CropCalibrationDialogComponent', () => {
  let component: CropCalibrationDialogComponent;
  let fixture: ComponentFixture<CropCalibrationDialogComponent>;

  beforeEach(async () => {
    const mockElectronCropService = {
      saveTempFile: vi.fn().mockResolvedValue({ success: false }),
      detectFaces: vi.fn().mockResolvedValue({ success: false }),
    };
    const mockLoggerService = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CropCalibrationDialogComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: ElectronCropService, useValue: mockElectronCropService },
        { provide: LoggerService, useValue: mockLoggerService }
      ],
    })
    .overrideComponent(CropCalibrationDialogComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(CropCalibrationDialogComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('initialSettings', {
      preset: 'custom',
      head_padding_top: 0.25,
      chin_padding_bottom: 0.40,
      shoulder_width: 0.85,
      face_position_y: 0.38,
      aspect_ratio: '4:5',
    } as any);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit close', () => {
    const spy = vi.fn();
    component.close.subscribe(spy);
    component.close.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should compute hasDetection', () => {
    expect(component.hasDetection()).toBe(false);
  });

  it('should compute aspectRatioPadding', () => {
    expect(component.aspectRatioPadding()).toBeDefined();
  });

  it('should compute cropCss', () => {
    // No face loaded, should return null
    expect(component.cropCss()).toBeNull();
  });

  it('should compute previewStyle', () => {
    // No face loaded, should return null
    expect(component.previewStyle()).toBeNull();
  });
});
