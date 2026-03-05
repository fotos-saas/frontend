import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PsRadioGroupComponent } from './ps-radio-group.component';

describe('PsRadioGroupComponent', () => {
  let component: PsRadioGroupComponent;
  let fixture: ComponentFixture<PsRadioGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PsRadioGroupComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(PsRadioGroupComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(PsRadioGroupComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('options', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default direction', () => {
    expect(component.direction()).toBe('vertical');
  });

  it('should have default variant', () => {
    expect(component.variant()).toBe('list');
  });
});
