import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ExpandableFiltersComponent } from './expandable-filters.component';

describe('ExpandableFiltersComponent', () => {
  let component: ExpandableFiltersComponent;
  let fixture: ComponentFixture<ExpandableFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpandableFiltersComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(ExpandableFiltersComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpandableFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default visibleCount', () => {
    expect(component.visibleCount()).toBe(3);
  });

  it('should have default size', () => {
    expect(component.size()).toBe('sm');
  });

  it('should compute visibleFilters', () => {
    expect(component.visibleFilters()).toBeDefined();
  });

  it('should compute hiddenFilters', () => {
    expect(component.hiddenFilters()).toBeDefined();
  });

  it('should compute hasHiddenFilters', () => {
    expect(component.hasHiddenFilters()).toBeDefined();
  });

  it('should compute activeHiddenCount', () => {
    expect(component.activeHiddenCount()).toBeDefined();
  });

  it('should compute hasAnyActiveFilter', () => {
    expect(component.hasAnyActiveFilter()).toBeDefined();
  });
});
