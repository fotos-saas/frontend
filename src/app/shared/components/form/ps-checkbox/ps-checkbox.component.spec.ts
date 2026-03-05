import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PsCheckboxComponent } from './ps-checkbox.component';

describe('PsCheckboxComponent', () => {
  let component: PsCheckboxComponent;
  let fixture: ComponentFixture<PsCheckboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PsCheckboxComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(PsCheckboxComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(PsCheckboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default indeterminate', () => {
    expect(component.indeterminate()).toBe(false);
  });
});
