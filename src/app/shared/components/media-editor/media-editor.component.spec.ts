import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MediaEditorComponent } from './media-editor.component';

describe('MediaEditorComponent', () => {
  let component: MediaEditorComponent;
  let fixture: ComponentFixture<MediaEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaEditorComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(MediaEditorComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(MediaEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default maxFiles', () => {
    expect(component.maxFiles()).toBe(5);
  });

  it('should have default maxSizeMB', () => {
    expect(component.maxSizeMB()).toBe(10);
  });

  it('should have default acceptedTypes', () => {
    expect(component.acceptedTypes()).toBe('image/jpeg,image/png,image/gif,image/webp,video/mp4');
  });

  it('should have default disabled', () => {
    expect(component.disabled()).toBe(false);
  });

  it('should have default existingLabel', () => {
    expect(component.existingLabel()).toBe('Meglévő képek/videók');
  });

  it('should have default newLabel', () => {
    expect(component.newLabel()).toBe('Új képek/videók hozzáadása');
  });

  it('should compute remainingMedia', () => {
    expect(component.remainingMedia()).toBeDefined();
  });

  it('should compute mediaToDelete', () => {
    expect(component.mediaToDelete()).toBeDefined();
  });

  it('should compute newFiles', () => {
    expect(component.newFiles()).toBeDefined();
  });

  it('should compute availableSlots', () => {
    expect(component.availableSlots()).toBeDefined();
  });

  it('should compute hasExistingMedia', () => {
    expect(component.hasExistingMedia()).toBeDefined();
  });

  it('should compute hasMediaToDelete', () => {
    expect(component.hasMediaToDelete()).toBeDefined();
  });

  it('should compute maxFileSizeBytes', () => {
    expect(component.maxFileSizeBytes()).toBeDefined();
  });
});
