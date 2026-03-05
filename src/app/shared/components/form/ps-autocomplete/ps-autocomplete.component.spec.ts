import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PsAutocompleteComponent } from './ps-autocomplete.component';

describe('PsAutocompleteComponent', () => {
  let component: PsAutocompleteComponent;
  let fixture: ComponentFixture<PsAutocompleteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PsAutocompleteComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(PsAutocompleteComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(PsAutocompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default loading', () => {
    expect(component.loading()).toBe(false);
  });

  it('should have default minChars', () => {
    expect(component.minChars()).toBe(2);
  });

  it('should have default debounceMs', () => {
    expect(component.debounceMs()).toBe(300);
  });

  it('should have default allowFreeText', () => {
    expect(component.allowFreeText()).toBe(true);
  });

  it('should compute filteredSuggestions', () => {
    expect(component.filteredSuggestions()).toBeDefined();
  });

  it('should compute showDropdown', () => {
    expect(component.showDropdown()).toBeDefined();
  });
});
