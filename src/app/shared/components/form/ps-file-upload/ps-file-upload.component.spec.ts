import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PsFileUploadComponent } from './ps-file-upload.component';
import { EnvironmentInjector } from '@angular/core';

describe('PsFileUploadComponent', () => {
  let component: PsFileUploadComponent;
  let fixture: ComponentFixture<PsFileUploadComponent>;

  beforeEach(async () => {
    const mockEnvironmentInjector = {};

    await TestBed.configureTestingModule({
      imports: [PsFileUploadComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: EnvironmentInjector, useValue: mockEnvironmentInjector }
      ],
    })
    .overrideComponent(PsFileUploadComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(PsFileUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default label', () => {
    expect(component.label()).toBe('');
  });

  it('should have default hint', () => {
    expect(component.hint()).toBe('');
  });

  it('should have default errorMessage', () => {
    expect(component.errorMessage()).toBe('');
  });

  it('should have default required', () => {
    expect(component.required()).toBe(false);
  });

  it('should have default disabled', () => {
    expect(component.disabled()).toBe(false);
  });

  it('should have default size', () => {
    expect(component.size()).toBe('full');
  });

  it('should have default state', () => {
    expect(component.state()).toBe('default');
  });

  it('should have default accept', () => {
    expect(component.accept()).toBe('.jpg,.jpeg,.png,.webp');
  });

  it('should have default acceptLabel', () => {
    expect(component.acceptLabel()).toBe('JPG, PNG, WebP');
  });

  it('should have default maxFiles', () => {
    expect(component.maxFiles()).toBe(10);
  });

  it('should have default maxSizeMB', () => {
    expect(component.maxSizeMB()).toBe(20);
  });

  it('should have default multiple', () => {
    expect(component.multiple()).toBe(true);
  });

  it('should have default variant', () => {
    expect(component.variant()).toBe('default');
  });

  it('should have default dropzoneText', () => {
    expect(component.dropzoneText()).toBe('');
  });

  it('should have default dropzoneHint', () => {
    expect(component.dropzoneHint()).toBe('');
  });

  it('should compute uniqueId', () => {
    expect(component.uniqueId()).toBeDefined();
  });

  it('should compute isDisabled', () => {
    expect(component.isDisabled()).toBeDefined();
  });

  it('should compute maxFileSize', () => {
    expect(component.maxFileSize()).toBeDefined();
  });

  it('should compute canAddMore', () => {
    expect(component.canAddMore()).toBeDefined();
  });

  it('should compute fileCountLabel', () => {
    expect(component.fileCountLabel()).toBeDefined();
  });

  it('should compute sizeClass', () => {
    expect(component.sizeClass()).toBeDefined();
  });

  it('should compute hostClasses', () => {
    expect(component.hostClasses()).toBeDefined();
  });

  it('should compute resolvedDropzoneText', () => {
    expect(component.resolvedDropzoneText()).toBeDefined();
  });

  it('should compute resolvedDropzoneHint', () => {
    expect(component.resolvedDropzoneHint()).toBeDefined();
  });
});
