import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PostHeaderComponent } from './post-header.component';

describe('PostHeaderComponent', () => {
  let component: PostHeaderComponent;
  let fixture: ComponentFixture<PostHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostHeaderComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(PostHeaderComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostHeaderComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('authorName', 'test');
    fixture.componentRef.setInput('authorType', 'test' as any);
    fixture.componentRef.setInput('createdAt', 'test');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default isEdited', () => {
    expect(component.isEdited()).toBe(false);
  });

  it('should compute showBadge', () => {
    expect(component.showBadge()).toBeDefined();
  });

  it('should compute badgeLabel', () => {
    expect(component.badgeLabel()).toBeDefined();
  });

  it('should compute formattedTime', () => {
    expect(component.formattedTime()).toBeDefined();
  });
});
