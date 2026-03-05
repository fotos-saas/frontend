import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { LoadMoreButtonComponent } from './load-more-button.component';

describe('LoadMoreButtonComponent', () => {
  let component: LoadMoreButtonComponent;
  let fixture: ComponentFixture<LoadMoreButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadMoreButtonComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(LoadMoreButtonComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoadMoreButtonComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('loadedCount', 0);
    fixture.componentRef.setInput('totalCount', 0);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default isLoading', () => {
    expect(component.isLoading()).toBe(false);
  });

  it('should emit loadMore', () => {
    const spy = vi.fn();
    component.loadMore.subscribe(spy);
    component.loadMore.emit();
    expect(spy).toHaveBeenCalled();
  });

  it('should compute hasMore', () => {
    expect(component.hasMore()).toBeDefined();
  });

  it('should compute remainingCount', () => {
    expect(component.remainingCount()).toBeDefined();
  });
});
