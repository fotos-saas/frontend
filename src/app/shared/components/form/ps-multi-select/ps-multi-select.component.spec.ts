import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PsMultiSelectComponent } from './ps-multi-select.component';

describe('PsMultiSelectComponent', () => {
  let component: PsMultiSelectComponent;
  let fixture: ComponentFixture<PsMultiSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PsMultiSelectComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(PsMultiSelectComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(PsMultiSelectComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('options', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default maxSelections', () => {
    expect(component.maxSelections()).toBe(0);
  });

  it('should have default chipDisplay', () => {
    expect(component.chipDisplay()).toBe(true);
  });

  it('should have default selectAllLabel', () => {
    expect(component.selectAllLabel()).toBe('Mind kijelölése');
  });

  it('should compute selectedLabels', () => {
    expect(component.selectedLabels()).toBeDefined();
  });

  it('should compute allSelected', () => {
    expect(component.allSelected()).toBeDefined();
  });

  it('should compute triggerText', () => {
    expect(component.triggerText()).toBeDefined();
  });
});
