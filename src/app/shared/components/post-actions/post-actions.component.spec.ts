import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PostActionsComponent } from './post-actions.component';

describe('PostActionsComponent', () => {
  let component: PostActionsComponent;
  let fixture: ComponentFixture<PostActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostActionsComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(PostActionsComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default canReply', () => {
    expect(component.canReply()).toBe(false);
  });

  it('should have default canEdit', () => {
    expect(component.canEdit()).toBe(false);
  });

  it('should have default canDelete', () => {
    expect(component.canDelete()).toBe(false);
  });

  it('should emit reply', () => {
    const spy = vi.fn();
    component.reply.subscribe(spy);
    component.reply.emit();
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
