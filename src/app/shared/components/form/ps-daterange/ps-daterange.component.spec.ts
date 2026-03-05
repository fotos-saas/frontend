import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PsDaterangeComponent } from './ps-daterange.component';

describe('PsDaterangeComponent', () => {
  let component: PsDaterangeComponent;
  let fixture: ComponentFixture<PsDaterangeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PsDaterangeComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(PsDaterangeComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(PsDaterangeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default min', () => {
    expect(component.min()).toBe('');
  });

  it('should have default max', () => {
    expect(component.max()).toBe('');
  });

  it('should have default fromLabel', () => {
    expect(component.fromLabel()).toBe('Mikortól');
  });

  it('should have default toLabel', () => {
    expect(component.toLabel()).toBe('Meddig');
  });

  it('should have default fromPlaceholder', () => {
    expect(component.fromPlaceholder()).toBe('Kezdő dátum...');
  });

  it('should have default toPlaceholder', () => {
    expect(component.toPlaceholder()).toBe('Záró dátum...');
  });

  it('should compute fromMax', () => {
    expect(component.fromMax()).toBeDefined();
  });

  it('should compute toMin', () => {
    expect(component.toMin()).toBeDefined();
  });
});
