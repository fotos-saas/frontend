import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PsSearchableSelectComponent } from './ps-searchable-select.component';

describe('PsSearchableSelectComponent', () => {
  let component: PsSearchableSelectComponent;
  let fixture: ComponentFixture<PsSearchableSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PsSearchableSelectComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(PsSearchableSelectComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(PsSearchableSelectComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('options', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default clearable', () => {
    expect(component.clearable()).toBe(false);
  });

  it('should have default allLabel', () => {
    expect(component.allLabel()).toBe('');
  });

  it('should have default searchPlaceholder', () => {
    expect(component.searchPlaceholder()).toBe('Keresés...');
  });

  it('should have default noResultsText', () => {
    expect(component.noResultsText()).toBe('Nincs találat');
  });

  it('should have default value', () => {
    expect(component.value()).toBe('');
  });

  it('should compute filteredOptions', () => {
    expect(component.filteredOptions()).toBeDefined();
  });

  it('should compute currentValue', () => {
    expect(component.currentValue()).toBeDefined();
  });

  it('should compute selectedLabel', () => {
    expect(component.selectedLabel()).toBeDefined();
  });

  it('should compute displayValue', () => {
    expect(component.displayValue()).toBeDefined();
  });
});
