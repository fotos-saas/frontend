import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CommentButtonComponent } from './comment-button.component';

describe('CommentButtonComponent', () => {
  let component: CommentButtonComponent;
  let fixture: ComponentFixture<CommentButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommentButtonComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(CommentButtonComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommentButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default display', () => {
    expect(component.display()).toBe('icon-text');
  });

  it('should have default label', () => {
    expect(component.label()).toBe('hozzászólás');
  });

  it('should have default active', () => {
    expect(component.active()).toBe(false);
  });

  it('should have default disabled', () => {
    expect(component.disabled()).toBe(false);
  });

  it('should emit clicked', () => {
    const spy = vi.fn();
    component.clicked.subscribe(spy);
    component.clicked.emit();
    expect(spy).toHaveBeenCalled();
  });
});
