import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { StatusDropdownComponent } from './status-dropdown.component';

describe('StatusDropdownComponent', () => {
  let component: StatusDropdownComponent;
  let fixture: ComponentFixture<StatusDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusDropdownComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(StatusDropdownComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatusDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default currentStatus', () => {
    expect(component.currentStatus()).toBe('not_started');
  });

  it('should have default currentLabel', () => {
    expect(component.currentLabel()).toBe('');
  });

  it('should have default currentColor', () => {
    expect(component.currentColor()).toBe('gray');
  });

  it('should have default shortLabels', () => {
    expect(component.shortLabels()).toBe(false);
  });
});
