import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PostAvatarComponent } from './post-avatar.component';

describe('PostAvatarComponent', () => {
  let component: PostAvatarComponent;
  let fixture: ComponentFixture<PostAvatarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostAvatarComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(PostAvatarComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostAvatarComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('authorName', 'test');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default size', () => {
    expect(component.size()).toBe('medium');
  });

  it('should compute initial', () => {
    expect(component.initial()).toBeDefined();
  });
});
