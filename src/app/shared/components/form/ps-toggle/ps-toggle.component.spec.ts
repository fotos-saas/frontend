import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PsToggleComponent } from './ps-toggle.component';

describe('PsToggleComponent', () => {
  let component: PsToggleComponent;
  let fixture: ComponentFixture<PsToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PsToggleComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(PsToggleComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(PsToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default labelPosition', () => {
    expect(component.labelPosition()).toBe('after');
  });
});
