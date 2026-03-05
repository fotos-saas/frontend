import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PostMediaGalleryComponent } from './post-media-gallery.component';

describe('PostMediaGalleryComponent', () => {
  let component: PostMediaGalleryComponent;
  let fixture: ComponentFixture<PostMediaGalleryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostMediaGalleryComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(PostMediaGalleryComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostMediaGalleryComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('media', []);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
