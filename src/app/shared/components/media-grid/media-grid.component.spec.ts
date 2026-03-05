import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MediaGridComponent } from './media-grid.component';

describe('MediaGridComponent', () => {
  let component: MediaGridComponent;
  let fixture: ComponentFixture<MediaGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaGridComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(MediaGridComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(MediaGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default maxVisible', () => {
    expect(component.maxVisible()).toBe(3);
  });

  it('should have default thumbnailSize', () => {
    expect(component.thumbnailSize()).toBe(64);
  });

  it('should compute hasMedia', () => {
    expect(component.hasMedia()).toBeDefined();
  });

  it('should compute visibleMedia', () => {
    expect(component.visibleMedia()).toBeDefined();
  });

  it('should compute moreCount', () => {
    expect(component.moreCount()).toBeDefined();
  });
});
