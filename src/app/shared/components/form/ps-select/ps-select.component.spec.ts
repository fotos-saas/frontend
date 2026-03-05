import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PsSelectComponent } from './ps-select.component';

describe('PsSelectComponent', () => {
  let component: PsSelectComponent;
  let fixture: ComponentFixture<PsSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PsSelectComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(PsSelectComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(PsSelectComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('options', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default emptyLabel', () => {
    expect(component.emptyLabel()).toBe('Válassz...');
  });

  it('should have default variant', () => {
    expect(component.variant()).toBe('dropdown');
  });

  it('should have default direction', () => {
    expect(component.direction()).toBe('horizontal');
  });

  it('should have default overlayClass', () => {
    expect(component.overlayClass()).toBe('');
  });

  it('should compute selectedLabel', () => {
    expect(component.selectedLabel()).toBeDefined();
  });

  it('should compute chevronSize', () => {
    expect(component.chevronSize()).toBeDefined();
  });

  it('should compute enabledOptions', () => {
    expect(component.enabledOptions()).toBeDefined();
  });
});
