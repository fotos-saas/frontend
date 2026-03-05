import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ViewModeToggleComponent } from './view-mode-toggle.component';

describe('ViewModeToggleComponent', () => {
  let component: ViewModeToggleComponent;
  let fixture: ComponentFixture<ViewModeToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewModeToggleComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(ViewModeToggleComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewModeToggleComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('options', []);
    fixture.componentRef.setInput('value', 'test');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
