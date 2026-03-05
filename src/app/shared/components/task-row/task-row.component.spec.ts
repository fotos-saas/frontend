import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TaskRowComponent } from './task-row.component';

describe('TaskRowComponent', () => {
  let component: TaskRowComponent;
  let fixture: ComponentFixture<TaskRowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskRowComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(TaskRowComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskRowComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('task', { id: 1 } as any);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default section', () => {
    expect(component.section()).toBe('my_own');
  });

  it('should have default showActions', () => {
    expect(component.showActions()).toBe(true);
  });

  it('should emit toggleComplete', () => {
    const spy = vi.fn();
    component.toggleComplete.subscribe(spy);
    component.toggleComplete.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit toggleReview', () => {
    const spy = vi.fn();
    component.toggleReview.subscribe(spy);
    component.toggleReview.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit edit', () => {
    const spy = vi.fn();
    component.edit.subscribe(spy);
    component.edit.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit delete', () => {
    const spy = vi.fn();
    component.delete.subscribe(spy);
    component.delete.emit();
    expect(spy).toHaveBeenCalled();
  });
});
