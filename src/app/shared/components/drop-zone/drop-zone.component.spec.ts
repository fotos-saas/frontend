import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { DropZoneComponent } from './drop-zone.component';

describe('DropZoneComponent', () => {
  let component: DropZoneComponent;
  let fixture: ComponentFixture<DropZoneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DropZoneComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(DropZoneComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(DropZoneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default uploading', () => {
    expect(component.uploading()).toBe(false);
  });

  it('should have default uploadProgress', () => {
    expect(component.uploadProgress()).toBe(0);
  });

  it('should have default accept', () => {
    expect(component.accept()).toBe('.jpg,.jpeg,.png,.webp');
  });

  it('should have default maxSize', () => {
    expect(component.maxSize()).toBe('20MB/kép');
  });

  it('should have default hint', () => {
    expect(component.hint()).toBe('JPG, PNG vagy WebP');
  });

  it('should compute displayProgress', () => {
    expect(component.displayProgress()).toBeDefined();
  });

  it('should compute phaseText', () => {
    expect(component.phaseText()).toBeDefined();
  });

  it('should compute detailText', () => {
    expect(component.detailText()).toBeDefined();
  });
});
