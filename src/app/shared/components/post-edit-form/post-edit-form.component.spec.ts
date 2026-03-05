import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PostEditFormComponent } from './post-edit-form.component';

describe('PostEditFormComponent', () => {
  let component: PostEditFormComponent;
  let fixture: ComponentFixture<PostEditFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostEditFormComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(PostEditFormComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostEditFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('initialContent', 'test');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default allowMedia', () => {
    expect(component.allowMedia()).toBe(true);
  });

  it('should have default isSubmitting', () => {
    expect(component.isSubmitting()).toBe(false);
  });

  it('should have default rows', () => {
    expect(component.rows()).toBe(4);
  });

  it('should emit cancel', () => {
    const spy = vi.fn();
    component.cancel.subscribe(spy);
    component.cancel.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should compute showMediaEditor', () => {
    expect(component.showMediaEditor()).toBeDefined();
  });
});
