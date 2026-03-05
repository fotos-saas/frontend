import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  let component: EmptyStateComponent;
  let fixture: ComponentFixture<EmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(EmptyStateComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('message', 'test');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default compact', () => {
    expect(component.compact()).toBe(false);
  });

  it('should emit buttonClickEvent', () => {
    const spy = vi.fn();
    component.buttonClickEvent.subscribe(spy);
    component.buttonClickEvent.emit();
    expect(spy).toHaveBeenCalled();
  });
});
