import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PsMultiSelectBoxComponent } from './ps-multi-select-box.component';

describe('PsMultiSelectBoxComponent', () => {
  let component: PsMultiSelectBoxComponent;
  let fixture: ComponentFixture<PsMultiSelectBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PsMultiSelectBoxComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(PsMultiSelectBoxComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(PsMultiSelectBoxComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('options', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default maxHeight', () => {
    expect(component.maxHeight()).toBe('200px');
  });

  it('should have default searchable', () => {
    expect(component.searchable()).toBe(false);
  });

  it('should compute filteredOptions', () => {
    expect(component.filteredOptions()).toBeDefined();
  });
});
