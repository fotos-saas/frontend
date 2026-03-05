import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RichTextEditorComponent } from './rich-text-editor.component';

describe('RichTextEditorComponent', () => {
  let component: RichTextEditorComponent;
  let fixture: ComponentFixture<RichTextEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RichTextEditorComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(RichTextEditorComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(RichTextEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default mode', () => {
    expect(component.mode()).toBe('standard');
  });

  it('should have default placeholder', () => {
    expect(component.placeholder()).toBe('Írd ide a szöveget...');
  });

  it('should have default maxLength', () => {
    expect(component.maxLength()).toBe(0);
  });

  it('should have default minHeight', () => {
    expect(component.minHeight()).toBe(120);
  });

  it('should have default maxHeight', () => {
    expect(component.maxHeight()).toBe(400);
  });

  it('should emit editorFocusEvent', () => {
    const spy = vi.fn();
    component.editorFocusEvent.subscribe(spy);
    component.editorFocusEvent.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit editorBlurEvent', () => {
    const spy = vi.fn();
    component.editorBlurEvent.subscribe(spy);
    component.editorBlurEvent.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should compute editorStyle', () => {
    expect(component.editorStyle()).toBeDefined();
  });
});
