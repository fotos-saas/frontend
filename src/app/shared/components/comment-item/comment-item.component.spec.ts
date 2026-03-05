import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CommentItemComponent } from './comment-item.component';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';

describe('CommentItemComponent', () => {
  let component: CommentItemComponent;
  let fixture: ComponentFixture<CommentItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommentItemComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(CommentItemComponent, {
      set: { imports: [TimeAgoPipe], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommentItemComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('authorName', 'test');
    fixture.componentRef.setInput('content', 'test');
    fixture.componentRef.setInput('createdAt', 'test');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit delete', () => {
    const spy = vi.fn();
    component.delete.subscribe(spy);
    component.delete.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit reply', () => {
    const spy = vi.fn();
    component.reply.subscribe(spy);
    component.reply.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit toggleReplies', () => {
    const spy = vi.fn();
    component.toggleReplies.subscribe(spy);
    component.toggleReplies.emit();
    expect(spy).toHaveBeenCalled();
  });
});
