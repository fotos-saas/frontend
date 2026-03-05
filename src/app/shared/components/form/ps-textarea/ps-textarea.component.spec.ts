import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PsTextareaComponent } from './ps-textarea.component';

describe('PsTextareaComponent', () => {
  let component: PsTextareaComponent;
  let fixture: ComponentFixture<PsTextareaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PsTextareaComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(PsTextareaComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(PsTextareaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default rows', () => {
    expect(component.rows()).toBe(4);
  });

  it('should have default maxLength', () => {
    expect(component.maxLength()).toBe(0);
  });

  it('should have default autoResize', () => {
    expect(component.autoResize()).toBe(false);
  });

  it('should compute charCount', () => {
    expect(component.charCount()).toBeDefined();
  });

  it('should compute charCountText', () => {
    expect(component.charCountText()).toBeDefined();
  });
});
