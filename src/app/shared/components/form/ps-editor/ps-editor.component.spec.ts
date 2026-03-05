import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PsEditorComponent } from './ps-editor.component';

describe('PsEditorComponent', () => {
  let component: PsEditorComponent;
  let fixture: ComponentFixture<PsEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PsEditorComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(PsEditorComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(PsEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default mode', () => {
    expect(component.mode()).toBe('standard');
  });

  it('should have default minHeight', () => {
    expect(component.minHeight()).toBe(0);
  });

  it('should have default maxHeight', () => {
    expect(component.maxHeight()).toBe(0);
  });

  it('should have default maxLength', () => {
    expect(component.maxLength()).toBe(0);
  });

  it('should compute effectiveMinHeight', () => {
    expect(component.effectiveMinHeight()).toBeDefined();
  });

  it('should compute effectiveMaxHeight', () => {
    expect(component.effectiveMaxHeight()).toBeDefined();
  });

  it('should compute charCountText', () => {
    expect(component.charCountText()).toBeDefined();
  });

  it('should compute isOverLimit', () => {
    expect(component.isOverLimit()).toBeDefined();
  });
});
