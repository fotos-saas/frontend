import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PsTagInputComponent } from './ps-tag-input.component';

describe('PsTagInputComponent', () => {
  let component: PsTagInputComponent;
  let fixture: ComponentFixture<PsTagInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PsTagInputComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(PsTagInputComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(PsTagInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default maxTags', () => {
    expect(component.maxTags()).toBe(0);
  });

  it('should have default allowDuplicates', () => {
    expect(component.allowDuplicates()).toBe(false);
  });

  it('should have default separator', () => {
    expect(component.separator()).toBe(',');
  });

  it('should compute canAddMore', () => {
    expect(component.canAddMore()).toBeDefined();
  });
});
