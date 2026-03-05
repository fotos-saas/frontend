import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PostContentComponent } from './post-content.component';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';

describe('PostContentComponent', () => {
  let component: PostContentComponent;
  let fixture: ComponentFixture<PostContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostContentComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(PostContentComponent, {
      set: { imports: [SafeHtmlPipe], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostContentComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('content', 'test');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
