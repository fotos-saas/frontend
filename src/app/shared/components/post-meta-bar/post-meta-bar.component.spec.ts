import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PostMetaBarComponent } from './post-meta-bar.component';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';

describe('PostMetaBarComponent', () => {
  let component: PostMetaBarComponent;
  let fixture: ComponentFixture<PostMetaBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostMetaBarComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(PostMetaBarComponent, {
      set: { imports: [TimeAgoPipe], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostMetaBarComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('authorName', 'test');
    fixture.componentRef.setInput('createdAt', 'test');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit commentsClick', () => {
    const spy = vi.fn();
    component.commentsClick.subscribe(spy);
    component.commentsClick.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit timeClick', () => {
    const spy = vi.fn();
    component.timeClick.subscribe(spy);
    component.timeClick.emit();
    expect(spy).toHaveBeenCalled();
  });
});
