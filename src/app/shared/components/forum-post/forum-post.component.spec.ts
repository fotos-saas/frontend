import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ForumPostComponent } from './forum-post.component';

describe('ForumPostComponent', () => {
  let component: ForumPostComponent;
  let fixture: ComponentFixture<ForumPostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForumPostComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(ForumPostComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(ForumPostComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('authorName', 'test');
    fixture.componentRef.setInput('authorType', 'test' as any);
    fixture.componentRef.setInput('content', 'test');
    fixture.componentRef.setInput('createdAt', 'test');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default isEdited', () => {
    expect(component.isEdited()).toBe(false);
  });

  it('should have default canEdit', () => {
    expect(component.canEdit()).toBe(false);
  });

  it('should have default canDelete', () => {
    expect(component.canDelete()).toBe(false);
  });

  it('should have default canReply', () => {
    expect(component.canReply()).toBe(false);
  });

  it('should have default isReply', () => {
    expect(component.isReply()).toBe(false);
  });

  it('should have default isEditing', () => {
    expect(component.isEditing()).toBe(false);
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
