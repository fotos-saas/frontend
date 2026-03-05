import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PostHeaderBarComponent } from './post-header-bar.component';

describe('PostHeaderBarComponent', () => {
  let component: PostHeaderBarComponent;
  let fixture: ComponentFixture<PostHeaderBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostHeaderBarComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(PostHeaderBarComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(PostHeaderBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default isPinned', () => {
    expect(component.isPinned()).toBe(false);
  });

  it('should have default showActions', () => {
    expect(component.showActions()).toBe(false);
  });

  it('should have default showPinAction', () => {
    expect(component.showPinAction()).toBe(false);
  });

  it('should have default showEditDelete', () => {
    expect(component.showEditDelete()).toBe(false);
  });

  it('should emit pinClick', () => {
    const spy = vi.fn();
    component.pinClick.subscribe(spy);
    component.pinClick.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit editClick', () => {
    const spy = vi.fn();
    component.editClick.subscribe(spy);
    component.editClick.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit deleteClick', () => {
    const spy = vi.fn();
    component.deleteClick.subscribe(spy);
    component.deleteClick.emit();
    expect(spy).toHaveBeenCalled();
  });
});
