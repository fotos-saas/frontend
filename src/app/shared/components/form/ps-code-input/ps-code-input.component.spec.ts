import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PsCodeInputComponent } from './ps-code-input.component';

describe('PsCodeInputComponent', () => {
  let component: PsCodeInputComponent;
  let fixture: ComponentFixture<PsCodeInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PsCodeInputComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(PsCodeInputComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(PsCodeInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default maxLength', () => {
    expect(component.maxLength()).toBe(6);
  });

  it('should have default masked', () => {
    expect(component.masked()).toBe(false);
  });

  it('should compute effectiveType', () => {
    expect(component.effectiveType()).toBeDefined();
  });

  it('should compute showPasswordToggle', () => {
    expect(component.showPasswordToggle()).toBeDefined();
  });
});
